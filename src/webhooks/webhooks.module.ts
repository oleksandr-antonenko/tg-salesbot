import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { AiModule } from '../ai/ai.module';
import { QueueModule } from '../queue/queue.module';
import { HttpModule } from '@nestjs/axios';
import { TelegramModule } from '../telegram/telegram.module';

/**
 * Webhooks module responsible for handling Shopify webhooks
 * Processes webhook events for product changes
 */
@Module({
  imports: [AiModule, QueueModule, HttpModule, TelegramModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
