import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { B2CSalesModule } from './sales/b2c-sales.module';
import { SalesModule } from './sales/sales.module';
import { AiModule } from './ai/ai.module';
import { ProductModule } from './product/product.module';
import { ShopModule } from './shop/shop.module';
import { ShopifyModule } from './shopify/shopify.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { GeminiModule } from './gemini/gemini.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CommonModule } from './common/common.module';
import { User, Conversation, Message, B2CUser } from './database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, Conversation, Message, B2CUser],
      synchronize: true, // automatically creates tables
      logging: false,
    }),
    // Core modules
    CommonModule,
    DatabaseModule,
    GeminiModule,
    
    // Business modules
    AuthModule,
    ShopModule,
    ShopifyModule,
    ProductModule,
    AiModule,
    
    // Sales modules
    SalesModule,
    B2CSalesModule,
    
    // Integration modules
    TelegramModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
