import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { GeminiModule } from '../gemini/gemini.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [GeminiModule, DatabaseModule],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
