import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Body,
  Logger,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ShopifyAuthGuard } from '../auth/shopify-auth.guard';
import { Shop } from '../shop/shop.entity';
import { ShopDecorator } from '../shop/shop.decorator';
import { ProductFetchResponseDto } from './dto/product-fetch-response.dto';

/**
 * ProductController responsible for product-related API endpoints
 * Follows Single Responsibility Principle by focusing only on product operations
 * All endpoints are protected by ShopifyAuthGuard for security
 */
@Controller('products')
@UseGuards(ShopifyAuthGuard)
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  /**
   * Fetch all products from Shopify and store them in our system
   * @param shop Shop entity from ShopifyAuthGuard
   * @returns Response with products count and status
   */
  @Post('fetch')
  async fetchProducts(
    @ShopDecorator() shop: Shop,
  ): Promise<ProductFetchResponseDto> {
    this.logger.log(`Fetching products for shop: ${shop.shopUrl}`);

    try {
      const products = await this.productService.fetchProducts(shop);

      return {
        success: true,
        message: `Successfully fetched ${products.length} products`,
        count: products.length,
        products: products,
      };
    } catch (error) {
      this.logger.error(`Error fetching products: ${error.message}`);
      return {
        success: false,
        message: `Failed to fetch products: ${error.message}`,
        count: 0,
        products: [],
      };
    }
  }

  /**
   * Get all products stored in our system
   * @param shop Shop entity from ShopifyAuthGuard
   * @returns Response with products
   */
  @Get()
  async getProducts(
    @ShopDecorator() shop: Shop,
  ): Promise<ProductFetchResponseDto> {
    this.logger.log(`Getting products for shop: ${shop.shopUrl}`);

    try {
      // In a real implementation, this would fetch from a database
      // For now, we'll reuse the fetchProducts method
      const products = await this.productService.fetchProducts(shop);

      return {
        success: true,
        message: `Retrieved ${products.length} products`,
        count: products.length,
        products: products,
      };
    } catch (error) {
      this.logger.error(`Error getting products: ${error.message}`);
      return {
        success: false,
        message: `Failed to get products: ${error.message}`,
        count: 0,
        products: [],
      };
    }
  }

  /**
   * Get a single product by ID
   * @param shop Shop entity from ShopifyAuthGuard
   * @param id Product ID
   * @returns Response with product
   */
  @Get(':id')
  async getProductById(
    @ShopDecorator() shop: Shop,
    @Param('id') id: string,
  ): Promise<any> {
    this.logger.log(`Getting product ${id} for shop: ${shop.shopUrl}`);

    try {
      // In a real implementation, this would fetch from a database or Shopify API
      // For now, we'll return a placeholder response
      return {
        success: true,
        message: `Retrieved product ${id}`,
        product: { id },
      };
    } catch (error) {
      this.logger.error(`Error getting product ${id}: ${error.message}`);
      return {
        success: false,
        message: `Failed to get product ${id}: ${error.message}`,
        product: null,
      };
    }
  }
}
