import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ShopifyApiService } from './shopify-api.service';

/**
 * Shopify module responsible for Shopify API communication
 * Follows Single Responsibility Principle by focusing only on Shopify API interactions
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // Increased timeout for potentially large responses
      maxRedirects: 5,
    }),
  ],
  providers: [ShopifyApiService],
  exports: [ShopifyApiService],
})
export class ShopifyModule {}
