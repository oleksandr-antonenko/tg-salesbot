import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

/**
 * Common module for shared components like filters, guards, interceptors
 * Follows SOLID principles by organizing related functionality
 */
@Module({
  imports: [TelegramModule],
  providers: [GlobalExceptionFilter],
  exports: [GlobalExceptionFilter],
})
export class CommonModule {}
