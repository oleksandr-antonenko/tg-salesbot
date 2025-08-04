import { Injectable, Logger } from '@nestjs/common';
import { ShopifyApiService } from '../shopify/shopify-api.service';
import { Shop } from '../shop/shop.entity';
import { Product } from './models/product.model';

/**
 * Service responsible for product-related operations
 * Follows Single Responsibility Principle by focusing only on product operations
 */
@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly shopifyApiService: ShopifyApiService) {}

  /**
   * Fetch products from Shopify
   * @param shop Shop entity with access token
   * @returns Array of products
   */
  async fetchProducts(shop: Shop): Promise<Product[]> {
    try {
      this.logger.log(`Fetching products for shop: ${shop.shopUrl}`);
      
      // Get products from Shopify API
      const shopifyProducts = await this.shopifyApiService.getProducts(shop);
      
      // Transform Shopify products to our product model
      const products = this.transformShopifyProducts(shopifyProducts);
      
      this.logger.log(`Fetched ${products.length} products for shop: ${shop.shopUrl}`);
      
      return products;
    } catch (error) {
      this.logger.error(`Failed to fetch products: ${error.message}`);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Transform Shopify products to our product model
   * @param shopifyProducts Products from Shopify API
   * @returns Transformed products
   */
  private transformShopifyProducts(shopifyProducts: any[]): Product[] {
    return shopifyProducts.map(product => ({
      id: product.id,
      title: product.title,
      description: product.body_html || '',
      vendor: product.vendor || '',
      productType: product.product_type || '',
      status: product.status || 'active',
      price: this.getProductPrice(product),
      images: this.transformProductImages(product.images || []),
      variants: this.transformProductVariants(product.variants || []),
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      shopifyId: product.id.toString(),
    }));
  }

  /**
   * Get the product price from the first variant
   * @param product Shopify product
   * @returns Product price
   */
  private getProductPrice(product: any): string {
    if (product.variants && product.variants.length > 0) {
      return product.variants[0].price || '0.00';
    }
    return '0.00';
  }

  /**
   * Transform Shopify product images to our product image model
   * @param images Shopify product images
   * @returns Transformed product images
   */
  private transformProductImages(images: any[]): any[] {
    return images.map(image => ({
      id: image.id,
      src: image.src,
      position: image.position || 1,
      alt: image.alt || '',
    }));
  }

  /**
   * Transform Shopify product variants to our product variant model
   * @param variants Shopify product variants
   * @returns Transformed product variants
   */
  private transformProductVariants(variants: any[]): any[] {
    return variants.map(variant => ({
      id: variant.id,
      title: variant.title,
      price: variant.price || '0.00',
      sku: variant.sku || '',
      position: variant.position || 1,
      inventoryQuantity: variant.inventory_quantity || 0,
      inventoryPolicy: variant.inventory_policy || 'deny',
      compareAtPrice: variant.compare_at_price || null,
      fulfillmentService: variant.fulfillment_service || 'manual',
      inventoryManagement: variant.inventory_management || null,
      taxable: variant.taxable !== false,
      barcode: variant.barcode || '',
      grams: variant.grams || 0,
      weight: variant.weight || 0,
      weightUnit: variant.weight_unit || 'kg',
      option1: variant.option1 || null,
      option2: variant.option2 || null,
      option3: variant.option3 || null,
      imageId: variant.image_id || null,
      createdAt: variant.created_at,
      updatedAt: variant.updated_at,
    }));
  }
}
