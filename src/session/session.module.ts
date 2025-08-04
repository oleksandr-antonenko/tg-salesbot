import { Module } from '@nestjs/common';
import { SessionService } from './session.service';

/**
 * Session module responsible for managing user sessions
 * Follows Single Responsibility Principle by focusing only on session management
 */
@Module({
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
