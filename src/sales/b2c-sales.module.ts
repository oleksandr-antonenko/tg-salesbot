import { Module } from '@nestjs/common';
import { B2CSalesService } from './b2c-sales.service';
import { B2CSalesController } from './b2c-sales.controller';
import { GeminiModule } from '../gemini/gemini.module';
import { DatabaseModule } from '../database/database.module';
import { ProductModule } from '../product/product.module';
import { AiModule } from '../ai/ai.module';
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [
    GeminiModule,
    DatabaseModule,
    ProductModule,
    AiModule,
    ShopModule,
  ],
  controllers: [B2CSalesController],
  providers: [B2CSalesService],
  exports: [B2CSalesService],
})
export class B2CSalesModule {}