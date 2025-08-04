Phase 1: NestJS Backend - Detailed PlanDuration: 2 WeeksTeam: Backend (NestJS)Primary Goal: To build and deploy the core application service. By the end of this phase, the service must handle Shopify OAuth, manage shop data in a database, provide secure endpoints for the frontend, and establish communication with the Python AI microservice.Week 1: Project Initialization & Local SetupFocus: Scaffolding the application, setting up the database, and establishing a robust local development environment.1.1. Task: Project Scaffolding & ConfigurationObjective: Create the initial NestJS project with a clean, modular structure and a solid configuration management system.Steps:Initialize Project: Use the NestJS CLI to create a new project.Bashnest new glutamize-backend-nestjs
Create Module Structure: Generate the core modules that will form the application's architecture. This separation of concerns is crucial for maintainability.Bashnest g module auth
nest g module shop
nest g module webhooks
nest g module queue
nest g module ai
Configuration Management: Install and configure the @nestjs/config module to handle environment variables securely.Bashnpm install @nestjs/config
Create Environment Files:Create a .env file for local development. This file must be added to .gitignore.Create a .env.example file to be committed to the repository, serving as a template for all required variables..env.example content:Фрагмент кода# Application
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/glutamize?schema=public

# Shopify
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_API_SCOPES=read_products,write_products,read_orders # Add necessary scopes
HOST=

# Python AI Service
AI_SERVICE_URL=http://localhost:8000
Load Configuration: Import and configure ConfigModule in your app.module.ts.TypeScript// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
//... other imports

@Module({
  imports:,
})
export class AppModule {}
1.2. Task: Database Integration (PostgreSQL)Objective: Connect the application to a PostgreSQL database using TypeORM and define the primary data entity.Steps:Install Dependencies:Bashnpm install @nestjs/typeorm typeorm pg
Configure Database Connection: In app.module.ts, configure TypeOrmModule to connect to your PostgreSQL instance using the URL from your environment variables.TypeScript// app.module.ts
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports:,
      inject:,
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true, // Note: Set to false in production
      }),
    }),
    //... other modules
  ],
})
export class AppModule {}
Create the Shop Entity: In the shop module, create the shop.entity.ts file. This entity will store essential information about each merchant's store.TypeScript// src/shop/shop.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  shopUrl: string;

  @Column()
  accessToken: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  plan: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
Register Entity: Import and register the Shop entity in the ShopModule.1.3. Task: Health Check EndpointObjective: Create a simple endpoint to verify that the service is running correctly.Steps:In the AppController, create a GET /health endpoint.TypeScript// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  healthCheck(): string {
    return 'OK';
  }
}
Week 2: Core Connections & AuthenticationFocus: Implementing the complete Shopify authentication flow and ensuring services can communicate.2.1. Task: Shopify OAuth 2.0 ImplementationObjective: Securely handle the Shopify OAuth handshake to obtain and store merchant access tokens.Steps:Create AuthService and AuthController: Use the NestJS CLI to generate these within the auth module.Implement Auth Initiation (GET /api/auth):This endpoint receives the shop URL as a query parameter from the initial app installation request.It constructs the Shopify authorization URL, including the apiKey, scopes, and redirectUri.It then redirects the merchant to this URL to grant permissions.TypeScript// src/auth/auth.controller.ts
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  @Get()
  initiateAuth(@Query('shop') shop: string, @Res() res: Response) {
    if (!shop) {
      return res.status(400).send('Missing shop parameter');
    }
    const apiKey = this.configService.get<string>('SHOPIFY_API_KEY');
    const scopes = this.configService.get<string>('SHOPIFY_API_SCOPES');
    const redirectUri = `${this.configService.get<string>('HOST')}/api/auth/callback`;

    const authUrl = `https://{shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}`;

    res.redirect(authUrl.replace('{shop}', shop));
  }
}
Implement Auth Callback (GET /api/auth/callback):This endpoint is the redirectUri that Shopify calls after the merchant grants permission.It receives a temporary code from Shopify.It must exchange this code for a permanent access_token by making a secure, server-to-server POST request to the shop's oauth/access_token endpoint.Once the access_token is received, it should be securely saved to the PostgreSQL database (upsert logic in ShopService).Finally, it redirects the merchant back into the embedded app in the Shopify Admin.2.2. Task: Session Token AuthenticationObjective: Create a NestJS Guard to protect internal API endpoints, ensuring they can only be accessed by an authenticated frontend running within Shopify.Steps:Create ShopifyAuthGuard: This guard will be responsible for validating the JWT session token provided by Shopify App Bridge.Implement Guard Logic:The guard extracts the token from the Authorization: Bearer <token> header.It decodes the JWT and verifies its signature using Shopify's public keys.It checks the aud (audience) claim against your app's API key and the dest (destination) claim against the shop's URL.If valid, it attaches the shop information to the request object for use in controllers. If invalid, it throws an UnauthorizedException.Note: Libraries like @shopify/shopify-api can simplify this verification process significantly.2.3. Task: Create Protected API EndpointObjective: Build the first secure endpoint for the frontend to consume.Steps:Create ShopController and ShopService: Generate these within the shop module.Implement GET /api/internal/shops/me:Apply the ShopifyAuthGuard to this endpoint using the @UseGuards() decorator.The controller method will access the shop data attached to the request by the guard.It will use the ShopService to fetch the full shop record from the database and return it to the frontend.TypeScript// src/shop/shop.controller.ts
@Controller('api/internal/shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('me')
  @UseGuards(ShopifyAuthGuard) // Your custom guard
  async getShop(@Req() req): Promise<Shop> {
    const shopUrl = req.user.shop; // Assuming guard attaches user object
    return this.shopService.findByUrl(shopUrl);
  }
}
2.4. Task: Inter-Service Communication TestObjective: Confirm that the NestJS service can successfully communicate with the Python AI microservice.Steps:Install @nestjs/axios:Bashnpm install @nestjs/axios axios
Import HttpModule: Import it into the AiModule.Create AiService:Inject HttpService.Create a method checkHealth() that makes a GET request to the Python service's /health endpoint.This confirms network connectivity between the Docker containers and prepares for more complex calls in Phase 2.Phase 1: Definition of Done[ ] Project Structure: The NestJS project is initialized with a modular structure and all required dependencies are installed.[ ] Configuration: Environment variables are managed via .env files and the @nestjs/config module.[ ] Database: The application successfully connects to the PostgreSQL database, and the Shop entity is defined and synchronized.[ ] Local Environment: The entire stack (NestJS, Python, DB, Redis) can be launched locally with a single docker-compose up command.[ ] Shopify OAuth: A merchant can install the app, complete the OAuth 2.0 flow, and have their shop URL and access token correctly stored in the database.[ ] API Security: A ShopifyAuthGuard is implemented and successfully protects the GET /api/internal/shops/me endpoint.[ ] End-to-End Flow: The React frontend can make an authenticated call to the protected /api/internal/shops/me endpoint and display the returned data.[ ] Service Connectivity: The NestJS service can successfully make an HTTP request to the Python service's /health endpoint.