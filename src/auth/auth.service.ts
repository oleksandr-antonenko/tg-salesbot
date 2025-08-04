import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShopService } from '../shop/shop.service';
import { SessionService } from '../session/session.service';
import { ShopifyApiService } from '../shopify/shopify-api.service';
import * as crypto from 'crypto';

/**
 * Service responsible for authentication-related operations
 * Handles Shopify OAuth flow and token management
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly shopService: ShopService,
    private readonly sessionService: SessionService,
    private readonly shopifyApiService: ShopifyApiService,
  ) {}

  /**
   * Generate the Shopify authorization URL
   * @param shop The shop URL to authorize
   * @returns The authorization URL
   */
  generateAuthUrl(shop: string): string {
    const apiKey = this.configService.get<string>('SHOPIFY_API_KEY');
    const scopes = this.configService.get<string>('SHOPIFY_API_SCOPES');
    const redirectUri = `${this.configService.get<string>('HOST')}/api/auth/callback`;

    // Ensure shop URL is properly formatted
    const formattedShop = this.formatShopDomain(shop);

    return `https://${formattedShop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}`;
  }

  /**
   * Exchange a temporary code for a permanent access token
   * @param shop The shop URL
   * @param code The temporary code from Shopify
   * @returns The access token and session ID
   */
  async exchangeCodeForToken(
    shop: string,
    code: string,
  ): Promise<{ accessToken: string; sessionId: string }> {
    try {
      const formattedShop = this.formatShopDomain(shop);
      const scopes = this.configService.get<string>('SHOPIFY_API_SCOPES');

      this.logger.log(`Exchanging code for token for shop: ${formattedShop}`);

      // Use ShopifyApiService to exchange code for token
      const { access_token: accessToken, scope: responseScope } =
        await this.shopifyApiService.exchangeCodeForToken(formattedShop, code);

      if (!accessToken) {
        throw new Error('No access token received from Shopify');
      }

      // Save the shop and token to the database
      await this.shopService.upsert({
        shopUrl: formattedShop,
        accessToken,
        isActive: true,
      });

      // Create a session for this shop
      const sessionId = this.sessionService.createSession(
        formattedShop,
        accessToken,
        responseScope || scopes || '',
        false, // Offline token by default
      );

      this.logger.log(
        `Successfully exchanged code for token for shop: ${formattedShop}`,
      );

      return { accessToken, sessionId };
    } catch (error) {
      this.logger.error(`Failed to exchange code for token: ${error.message}`);
      throw new Error(`Failed to exchange code for token: ${error.message}`);
    }
  }

  /**
   * Format the shop domain to ensure it's in the correct format
   * @param shop The shop domain to format
   * @returns The formatted shop domain
   */
  formatShopDomain(shop: string): string {
    // Remove protocol if present
    let formattedShop = shop.replace(/^https?:\/\//, '');

    // Ensure shop has .myshopify.com domain
    if (!formattedShop.includes('myshopify.com')) {
      formattedShop = `${formattedShop}.myshopify.com`;
    }

    return formattedShop;
  }

  /**
   * Verify the HMAC signature from Shopify
   * @param query Query parameters from the request
   * @param hmac HMAC signature from Shopify
   * @returns Whether the signature is valid
   */
  verifyHmac(
    query: Record<string, string | undefined>,
    providedHmac: string,
  ): boolean {
    try {
      // Get the API secret
      const apiSecret = this.configService.get<string>('SHOPIFY_API_SECRET');

      // Create a copy of the query without the hmac
      const { hmac, ...queryParams } = query as Record<string, string>;

      // Sort the parameters
      const sortedParams = Object.keys(queryParams)
        .filter((key) => queryParams[key] !== undefined)
        .sort()
        .map((key) => `${key}=${queryParams[key]}`);

      // Join the parameters
      const message = sortedParams.join('&');

      // Calculate the HMAC
      const calculatedHmac = crypto
        .createHmac('sha256', apiSecret || '')
        .update(message)
        .digest('hex');

      // Compare the HMACs using a timing-safe comparison
      return this.timingSafeEqual(calculatedHmac, providedHmac);
    } catch (error) {
      this.logger.error(`Error verifying HMAC: ${error.message}`);
      return false;
    }
  }

  /**
   * Timing-safe comparison of two strings
   * @param a First string
   * @param b Second string
   * @returns Whether the strings are equal
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}
