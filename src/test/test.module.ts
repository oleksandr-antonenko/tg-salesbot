import { Module } from '@nestjs/common';
import { TestController } from './test.controller';

/**
 * Test module for verifying global exception filter functionality
 * This should be removed in production
 */
@Module({
  controllers: [TestController],
})
export class TestModule {}
