import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { GeminiModule } from '../gemini/gemini.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [GeminiModule, SalesModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
