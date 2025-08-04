import { Controller, Get, Post, HttpException, HttpStatus } from '@nestjs/common';

/**
 * Test controller for verifying global exception filter functionality
 * This should be removed in production
 */
@Controller('test')
export class TestController {
  
  /**
   * Test endpoint that throws an HTTP exception
   */
  @Get('http-error')
  testHttpError(): never {
    throw new HttpException('Test HTTP error for Telegram notification', HttpStatus.BAD_REQUEST);
  }

  /**
   * Test endpoint that throws a runtime error
   */
  @Get('runtime-error')
  testRuntimeError(): never {
    throw new Error('Test runtime error for Telegram notification');
  }

  /**
   * Test endpoint that throws an unknown error
   */
  @Get('unknown-error')
  testUnknownError(): never {
    throw 'Test unknown error for Telegram notification';
  }

  /**
   * Test endpoint that simulates a database error
   */
  @Post('database-error')
  testDatabaseError(): never {
    const error = new Error('Database connection failed');
    error.stack = `Error: Database connection failed
    at TestController.testDatabaseError (/app/src/test/test.controller.ts:32:19)
    at /app/node_modules/@nestjs/core/router/router-execution-context.js:38:29`;
    throw error;
  }

  /**
   * Test endpoint that works correctly (no error)
   */
  @Get('success')
  testSuccess(): { message: string; timestamp: string } {
    return {
      message: 'Test endpoint working correctly',
      timestamp: new Date().toISOString(),
    };
  }
}
