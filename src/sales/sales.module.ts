import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [GeminiModule],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
