import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { GeminiModule } from '../gemini/gemini.module';
import { SalesModule } from '../sales/sales.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [GeminiModule, SalesModule, DatabaseModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
