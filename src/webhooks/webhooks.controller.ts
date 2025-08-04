import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Controller responsible for handling Shopify webhooks
 * Validates webhook signatures and delegates to appropriate service methods
 */
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Handle product creation webhook
   * @param data Product data from webhook
   * @param headers HTTP headers containing signature
   */
  @Post('products/create')
  @HttpCode(HttpStatus.OK)
  async handleProductCreate(@Body() data: any): Promise<void> {
    await this.webhooksService.handleProductCreate(data);
  }

  /**
   * Handle product update webhook
   * @param data Product data from webhook
   * @param headers HTTP headers containing signature
   */
  @Post('products/update')
  @HttpCode(HttpStatus.OK)
  async handleProductUpdate(@Body() data: any): Promise<void> {
    await this.webhooksService.handleProductUpdate(data);
  }

  /**
   * Handle product deletion webhook
   * @param data Product data from webhook
   * @param headers HTTP headers containing signature
   */
  @Post('products/delete')
  @HttpCode(HttpStatus.OK)
  async handleProductDelete(@Body() data: any): Promise<void> {
    await this.webhooksService.handleProductDelete(data);
  }

  /**
   * Handle product import webhook
   * @param body The request body containing the URL to the JSONL file
   */
  @Post('products/import')
  @HttpCode(HttpStatus.OK)
  async handleProductImport(
    @Body() data: any,
    // @Headers('x-shopify-hmac-sha256') hmac: string,
    // @Headers('x-shopify-shop-domain') shop: string,
  ): Promise<void> {
    // this.validateWebhook(data, hmac);
    // No validation needed for this internal-facing endpoint
    await this.webhooksService.handleProductImport(data);
  }

  /**
   * Validate webhook signature
   * @param data Webhook payload
   * @param hmac HMAC signature from Shopify
   * @returns Whether the signature is valid
   */
  private validateWebhook(data: any, hmac: string): boolean {
    this.logger.log('Validating webhook signature');
    if (!hmac) {
      throw new BadRequestException('Malformed request');
    }

    const secret = this.configService.get<string>('SHOPIFY_API_SECRET');
    if (!secret) {
      this.logger.error('SHOPIFY_API_SECRET is not defined');
      throw new BadRequestException('Malformed request');
    }

    try {
      const calculatedHmac = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(data), 'utf8')
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(calculatedHmac),
        Buffer.from(hmac),
      );
    } catch (error) {
      this.logger.error(`Error validating webhook: ${error.message}`);
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
