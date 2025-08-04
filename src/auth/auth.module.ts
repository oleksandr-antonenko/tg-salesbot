import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ShopModule } from '../shop/shop.module';
import { ShopifyAuthGuard } from './shopify-auth.guard';
import { SessionModule } from '../session/session.module';
import { ShopifyModule } from '../shopify/shopify.module';

/**
 * Auth module responsible for authentication-related operations
 * Handles Shopify OAuth flow and token management with secure HMAC verification
 */
@Module({
  imports: [
    ShopModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    SessionModule,
    ShopifyModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, ShopifyAuthGuard],
  exports: [AuthService, ShopifyAuthGuard],
})
export class AuthModule {}
