import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ShopService } from '../shop/shop.service';
import { SessionService } from '../session/session.service';

/**
 * Guard to protect routes that require Shopify authentication
 * Validates the shop and access token from the request
 * Follows Single Responsibility Principle by focusing only on authentication
 */
@Injectable()
export class ShopifyAuthGuard implements CanActivate {
  private readonly logger = new Logger(ShopifyAuthGuard.name);

  constructor(
    private readonly shopService: ShopService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Validates if the request is authenticated with a valid Shopify shop
   * @param context Execution context containing the request
   * @returns Boolean indicating if the request is authorized
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // First try to authenticate with session
      const sessionId = this.extractSessionId(request);
      if (sessionId) {
        const session = this.sessionService.getSession(sessionId);
        if (session) {
          // Session is valid, get the shop from database
          const shopEntity = await this.shopService.findByUrl(session.shop);
          if (shopEntity && shopEntity.isActive) {
            // Attach shop and session to request for use in controllers
            request['shop'] = shopEntity;
            request['session'] = session;
            return true;
          }
        }
      }

      // If session authentication fails, try token-based authentication
      // Extract shop from query parameters or headers
      const shop = this.extractShop(request);
      if (!shop) {
        this.logger.warn('No shop or session provided in request');
        throw new UnauthorizedException('No shop or session provided');
      }

      // Extract token from authorization header
      const token = this.extractToken(request);
      if (!token) {
        this.logger.warn(`No token provided for shop: ${shop}`);
        throw new UnauthorizedException('No token provided');
      }

      // Validate shop and token against database
      const shopEntity = await this.shopService.findByUrl(shop);
      if (!shopEntity) {
        this.logger.warn(`Shop not found: ${shop}`);
        throw new UnauthorizedException('Shop not found');
      }

      if (!shopEntity.accessToken || shopEntity.accessToken !== token) {
        this.logger.warn(`Invalid token for shop: ${shop}`);
        throw new UnauthorizedException('Invalid token');
      }

      if (!shopEntity.isActive) {
        this.logger.warn(`Shop is not active: ${shop}`);
        throw new UnauthorizedException('Shop is not active');
      }

      // Attach shop to request for use in controllers
      request['shop'] = shopEntity;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Authentication error: ${error.message}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Extract shop from request
   * @param request HTTP request
   * @returns Shop URL
   */
  private extractShop(request: Request): string | undefined {
    // Try to get shop from query parameters
    const shopQuery = request.query.shop as string;
    if (shopQuery) {
      return this.normalizeShopDomain(shopQuery);
    }

    // Try to get shop from headers
    const shopHeader = request.headers['x-shopify-shop-domain'] as string;
    if (shopHeader) {
      return this.normalizeShopDomain(shopHeader);
    }

    return undefined;
  }

  /**
   * Extract token from request authorization header
   * @param request HTTP request
   * @returns Access token
   */
  private extractToken(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    // Check if it's a Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return undefined;
    }

    return parts[1];
  }

  /**
   * Extract session ID from request
   * @param request HTTP request
   * @returns Session ID
   */
  private extractSessionId(request: Request): string | undefined {
    // Try to get session from query parameters
    const sessionQuery = request.query.session as string;
    if (sessionQuery) {
      return sessionQuery;
    }

    // Try to get session from cookies
    const sessionCookie = request.cookies?.shopifySession;
    if (sessionCookie) {
      return sessionCookie;
    }

    // Try to get session from headers
    const sessionHeader = request.headers['x-shopify-session'] as string;
    if (sessionHeader) {
      return sessionHeader;
    }

    return undefined;
  }

  /**
   * Normalize shop domain to ensure consistent format
   * @param shop Shop domain
   * @returns Normalized shop domain
   */
  private normalizeShopDomain(shop: string): string {
    // Remove protocol if present
    let normalizedShop = shop.replace(/^https?:\/\//, '');

    // Remove trailing slash if present
    normalizedShop = normalizedShop.replace(/\/$/, '');

    // Ensure .myshopify.com domain
    if (!normalizedShop.includes('.myshopify.com')) {
      normalizedShop = `${normalizedShop}.myshopify.com`;
    }

    return normalizedShop.toLowerCase();
  }
}
