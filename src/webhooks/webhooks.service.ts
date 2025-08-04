import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { QueueService } from '../queue/queue.service';
import { HttpService } from '@nestjs/axios';
import { TelegramService } from '../telegram/telegram.service';
/**
 * Service responsible for handling Shopify webhooks
 * Processes webhook events and delegates to appropriate services
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly aiService: AiService,
    private readonly queueService: QueueService,
    private readonly httpService: HttpService,
    private readonly telegramService: TelegramService,
  ) {}

  /**
   * Handle product import from a URL
   * @param url URL to a JSONL file with product data
   */
  async handleProductImport(body: Record<string, any>): Promise<void> {
    this.logger.log(`Importing products from URL: ${body.export_file_url}`);
    // 1. Convert the JSON object to a string
    const jsonString = JSON.stringify(body, null, 2); // Using 2 for pretty-printing

    // 2. Wrap the string in a MarkdownV2 code block
    const url = `\`\`\`json\n${jsonString}\n\`\`\``;
    this.logger.log(`Starting product import from URL: ${url}`);
    try {
      await this.telegramService.sendMessage(url);
      this.queueService.resendDataRecord(body);
      this.logger.log(url);
    } catch (error) {
      this.logger.error(
        `Failed to import products from URL: ${url}: ${error.message}`,
      );
      await this.telegramService.sendMessage(
        `Failed to import products from ${url}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Handle product creation webhook
   * @param data Product data from webhook
   */
  async handleProductCreate(data: any): Promise<void> {
    try {
      this.logger.log(
        `Processing product create webhook for product ID: ${data.id}`,
      );
      await this.telegramService.sendMessage(data);

      // Extract product information
      const productId = data.id.toString();
      const document = this.aiService.extractProductText(data);
      const metadata = this.aiService.extractProductMetadata(data);

      // Upsert vector in AI service
      await this.aiService.upsertVector(productId, document, metadata);

      this.logger.log(
        `Successfully processed product create webhook for product ID: ${data.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing product create webhook: ${error.message}`,
      );
    }
  }

  /**
   * Handle product update webhook
   * @param data Product data from webhook
   */
  async handleProductUpdate(data: any): Promise<void> {
    try {
      this.logger.debug(JSON.stringify(data));
      const productId = data?.product?.id;

      this.logger.log(
        `Processing product update webhook for product ID: ${productId}`,
      );
      await this.telegramService.sendMessage(JSON.stringify(data));

      // Extract product information
      // const document = this.aiService.extractProductText(data);
      // const metadata = this.aiService.extractProductMetadata(data);

      // Upsert vector in AI service
      // await this.aiService.upsertVector(productId, document, metadata);

      this.logger.log(
        `Successfully processed product update webhook for product ID: ${productId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing product update webhook: ${error.message}`,
      );
    }
  }

  /**
   * Handle product deletion webhook
   * @param data Product data from webhook
   */
  async handleProductDelete(data: any): Promise<void> {
    try {
      this.logger.debug(JSON.stringify(data));
      const productId = data?.product?.shopify_id;

      this.logger.log(
        `Processing product delete webhook for product ID: ${productId}`,
      );
      await this.telegramService.sendMessage(
        JSON.stringify(data) || 'Empty payload',
      );

      // Delete vector from AI service
      // await this.aiService.deleteVector(productId);

      this.logger.log(
        `Successfully processed product delete webhook for product ID: ${productId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing product delete webhook: ${error.message}`,
      );
    }
  }
}
