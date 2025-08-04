import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TelegramService } from '../../telegram/telegram.service';
import { ErrorMonitoringService } from '../services/error-monitoring.service';

/**
 * Global exception filter that catches all exceptions and sends them to Telegram
 * Follows SOLID principles by having a single responsibility: exception handling and notification
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly telegramService: TelegramService) {}

  /**
   * Catch and handle all exceptions
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, stack } = this.extractExceptionDetails(exception);
    const context = this.buildErrorContext(request, status);

    // Log the error locally
    this.logger.error(`Exception caught: ${message}`, stack);

    // Send error to Telegram asynchronously (don't block the response)
    this.sendErrorToTelegram(exception, context).catch((telegramError) => {
      this.logger.error('Failed to send error to Telegram:', telegramError);
    });

    // Send response to client
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.sanitizeErrorMessage(message),
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Extract status, message, and stack from any type of exception
   */
  private extractExceptionDetails(exception: unknown): {
    status: number;
    message: string;
    stack?: string;
  } {
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        message: exception.message,
        stack: exception.stack,
      };
    }

    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
        stack: exception.stack,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unknown error occurred',
      stack: String(exception),
    };
  }

  /**
   * Build context information for the error
   */
  private buildErrorContext(request: Request, status: number): string {
    const userAgent = request.get('User-Agent') || 'Unknown';
    const ip = request.ip || 'Unknown';
    
    return [
      `Method: ${request.method}`,
      `URL: ${request.url}`,
      `Status: ${status}`,
      `IP: ${ip}`,
      `User-Agent: ${userAgent}`,
      `Body: ${JSON.stringify(request.body || {})}`,
      `Query: ${JSON.stringify(request.query || {})}`,
    ].join('\n');
  }

  /**
   * Send error to Telegram with proper error handling
   */
  private async sendErrorToTelegram(exception: unknown, context: string): Promise<void> {
    try {
      const error = exception instanceof Error 
        ? exception 
        : new Error(String(exception));
      
      await this.telegramService.sendErrorMessage(error, context);
    } catch (telegramError) {
      // Don't let Telegram errors crash the application
      this.logger.error('Telegram notification failed:', telegramError);
    }
  }

  /**
   * Sanitize error message for client response (remove sensitive information)
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove potential sensitive information from error messages
    return message
      .replace(/password[=:]\s*\S+/gi, 'password=***')
      .replace(/token[=:]\s*\S+/gi, 'token=***')
      .replace(/key[=:]\s*\S+/gi, 'key=***');
  }
}
