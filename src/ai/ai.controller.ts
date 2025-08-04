import { Controller, Get } from '@nestjs/common';
import { AiService } from './ai.service';

/**
 * Controller responsible for AI-related endpoints
 * Provides endpoints for testing communication with the Python AI microservice
 */
@Controller('internal/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * Check the health of the Python AI microservice
   * @returns Health status of the AI service
   */
  @Get('health')
  async checkHealth(): Promise<{ status: string }> {
    return this.aiService.checkHealth();
  }
}
