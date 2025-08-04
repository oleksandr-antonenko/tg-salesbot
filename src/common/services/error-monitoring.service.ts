import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service for monitoring and tracking error patterns
 * Implements rate limiting and error aggregation to prevent spam
 */
@Injectable()
export class ErrorMonitoringService {
  private readonly logger = new Logger(ErrorMonitoringService.name);
  private readonly errorCache = new Map<string, { count: number; lastSeen: Date }>();
  private readonly maxErrorsPerHour: number;
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {
    this.maxErrorsPerHour = this.configService.get<number>('MAX_ERRORS_PER_HOUR', 10);
    
    // Clean up old error entries every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldErrors();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Check if error should be reported based on rate limiting
   */
  shouldReportError(error: Error, context?: string): boolean {
    const errorKey = this.generateErrorKey(error, context);
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const errorInfo = this.errorCache.get(errorKey);
    
    if (!errorInfo) {
      // First occurrence of this error
      this.errorCache.set(errorKey, { count: 1, lastSeen: now });
      return true;
    }

    // Update last seen time
    errorInfo.lastSeen = now;

    // If error was first seen more than an hour ago, reset count
    if (errorInfo.lastSeen < hourAgo) {
      errorInfo.count = 1;
      return true;
    }

    // Increment count and check if we should report
    errorInfo.count++;
    
    if (errorInfo.count <= this.maxErrorsPerHour) {
      return true;
    }

    // Log that we're suppressing this error
    if (errorInfo.count === this.maxErrorsPerHour + 1) {
      this.logger.warn(`Suppressing error notifications for: ${errorKey} (rate limit exceeded)`);
    }

    return false;
  }

  /**
   * Generate a unique key for error tracking
   */
  private generateErrorKey(error: Error, context?: string): string {
    const errorMessage = error.message || 'Unknown error';
    const stackFirstLine = error.stack?.split('\n')[1]?.trim() || 'No stack';
    const contextKey = context ? ` | ${context.split('\n')[0]}` : '';
    
    return `${errorMessage} | ${stackFirstLine}${contextKey}`;
  }

  /**
   * Clean up error entries older than 2 hours
   */
  private cleanupOldErrors(): void {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [key, errorInfo] of this.errorCache.entries()) {
      if (errorInfo.lastSeen < twoHoursAgo) {
        this.errorCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} old error entries`);
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalUniqueErrors: number;
    recentErrors: Array<{ key: string; count: number; lastSeen: Date }>;
  } {
    const recentErrors = Array.from(this.errorCache.entries()).map(([key, info]) => ({
      key,
      count: info.count,
      lastSeen: info.lastSeen,
    }));

    return {
      totalUniqueErrors: this.errorCache.size,
      recentErrors: recentErrors.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime()),
    };
  }

  /**
   * Clean up resources on service destruction
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
