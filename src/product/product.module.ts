import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ShopModule } from '../shop/shop.module';
import { AuthModule } from '../auth/auth.module';
import { ShopifyModule } from '../shopify/shopify.module';
import { SessionService } from 'src/session/session.service';

/**
 * Product module responsible for Shopify product operations
 * Follows Single Responsibility Principle by focusing only on product-related operations
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // Increased timeout for potentially large product catalogs
      maxRedirects: 5,
    }),
    ShopModule,
    AuthModule,
    ShopifyModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, SessionService],
  exports: [ProductService],
})
export class ProductModule {}
