import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Shop } from '../shop/shop.entity';

/**
 * Service responsible for all Shopify API interactions
 * Follows Single Responsibility Principle by centralizing all Shopify API calls
 */
@Injectable()
export class ShopifyApiService {
  private readonly logger = new Logger(ShopifyApiService.name);
  private readonly shopifyApiVersion: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.shopifyApiVersion =
      this.configService.get<string>('SHOPIFY_API_VERSION') || '2023-10';
    this.logger.log(
      `Initialized with Shopify API version: ${this.shopifyApiVersion}`,
    );
  }

  /**
   * Exchange OAuth code for access token
   * @param shop Shopify shop domain
   * @param code OAuth code from Shopify
   * @returns Access token response
   */
  async exchangeCodeForToken(
    shop: string,
    code: string,
  ): Promise<{ access_token: string; scope: string }> {
    try {
      const apiKey = this.configService.get<string>('SHOPIFY_API_KEY');
      const apiSecret = this.configService.get<string>('SHOPIFY_API_SECRET');

      this.logger.log(`Exchanging code for token for shop: ${shop}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `https://${shop}/admin/oauth/access_token`,
          {
            client_id: apiKey,
            client_secret: apiSecret,
            code,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to exchange code for token: ${error.message}`);
      throw new Error(`Failed to exchange code for token: ${error.message}`);
    }
  }

  /**
   * Get all products from a shop
   * @param shop Shop entity with access token
   * @returns Array of products
   */
  async getProducts(shop: Shop): Promise<any[]> {
    try {
      let allProducts: any[] = [];
      let nextPageUrl: string | null =
        `https://${shop.shopUrl}/admin/api/${this.shopifyApiVersion}/products.json?limit=250`;

      while (nextPageUrl) {
        const response = await firstValueFrom(
          this.httpService.get(nextPageUrl, {
            headers: {
              'X-Shopify-Access-Token': shop.accessToken,
              'Content-Type': 'application/json',
            },
          }),
        );

        const products = response.data.products || [];
        allProducts = [...allProducts, ...products];

        // Check for Link header for pagination
        const linkHeader = response.headers.link || response.headers.Link;
        nextPageUrl = this.extractNextPageUrl(linkHeader);

        this.logger.log(
          `Fetched ${products.length} products. Total so far: ${allProducts.length}`,
        );
      }

      return allProducts;
    } catch (error) {
      this.logger.error(`Failed to get products: ${error.message}`);
      throw new Error(`Failed to get products: ${error.message}`);
    }
  }

  /**
   * Get a single product by ID
   * @param shop Shop entity with access token
   * @param productId Product ID
   * @returns Product data
   */
  async getProductById(shop: Shop, productId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://${shop.shopUrl}/admin/api/${this.shopifyApiVersion}/products/${productId}.json`,
          {
            headers: {
              'X-Shopify-Access-Token': shop.accessToken,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data.product;
    } catch (error) {
      this.logger.error(`Failed to get product ${productId}: ${error.message}`);
      throw new Error(`Failed to get product ${productId}: ${error.message}`);
    }
  }

  /**
   * Create a webhook subscription
   * @param shop Shop entity with access token
   * @param topic Webhook topic
   * @param address Webhook address
   * @returns Webhook subscription data
   */
  async createWebhook(
    shop: Shop,
    topic: string,
    address: string,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `https://${shop.shopUrl}/admin/api/${this.shopifyApiVersion}/webhooks.json`,
          {
            webhook: {
              topic,
              address,
              format: 'json',
            },
          },
          {
            headers: {
              'X-Shopify-Access-Token': shop.accessToken,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data.webhook;
    } catch (error) {
      this.logger.error(
        `Failed to create webhook for ${topic}: ${error.message}`,
      );
      throw new Error(
        `Failed to create webhook for ${topic}: ${error.message}`,
      );
    }
  }

  /**
   * Extract next page URL from Link header
   * @param linkHeader Link header from Shopify API
   * @returns Next page URL or null if no more pages
   */
  private extractNextPageUrl(linkHeader: string | undefined): string | null {
    if (!linkHeader) {
      return null;
    }

    // Parse Link header to find next page URL
    const links = linkHeader.split(',');
    const nextLink = links.find((link) => link.includes('rel="next"'));

    if (!nextLink) {
      return null;
    }

    // Extract URL from link
    const matches = nextLink.match(/<([^>]+)>/);
    return matches ? matches[1] : null;
  }
}
