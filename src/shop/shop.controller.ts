import {
  Controller,
  Get,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { Shop } from './shop.entity';
import { ShopifyAuthGuard } from '../auth/shopify-auth.guard';
import { Request } from 'express';

/**
 * Controller responsible for shop-related endpoints
 * Implements API endpoints for shop management
 * Protected by ShopifyAuthGuard for secure access
 */
@Controller('internal/shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  /**
   * Get the current shop information
   * Protected by ShopifyAuthGuard to ensure authenticated access
   * @param req Request object containing shop information attached by the guard
   * @returns The shop entity
   */
  @Get('me')
  @UseGuards(ShopifyAuthGuard)
  async getShop(@Req() req: Request & { shop?: Shop }): Promise<Shop> {
    // The ShopifyAuthGuard attaches the shop entity to the request
    // If we reach this point, authentication was successful
    if (!req.shop) {
      throw new NotFoundException('Shop not found');
    }

    return req.shop;
  }
}
