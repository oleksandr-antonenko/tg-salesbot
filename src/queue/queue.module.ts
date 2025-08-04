import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { ProductProcessor } from './queue.processor';
import { AiModule } from '../ai/ai.module';

/**
 * Queue module responsible for handling asynchronous tasks
 * Uses Bull and Redis for reliable job processing
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: parseInt(configService.get('REDIS_PORT', '6379')),
        },
        defaultJobOptions: {
          removeOnComplete: true,
          attempts: 3,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'product-processing' },
      { name: 'product_exports' },
      // Add more queues here as needed
    ),
    AiModule,
  ],
  providers: [QueueService, ProductProcessor],
  exports: [QueueService],
})
export class QueueModule {}
