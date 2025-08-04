import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Interface for session data
 */
interface Session {
  id: string;
  shop: string;
  accessToken: string;
  scope: string;
  isOnline: boolean;
  expires?: Date;
  createdAt: Date;
}

/**
 * Service responsible for managing user sessions
 * Follows Single Responsibility Principle by focusing only on session management
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessions: Map<string, Session> = new Map();
  private readonly sessionSecret: string;

  constructor() {
    // Use environment variable or generate a random secret
    this.sessionSecret =
      process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
    this.logger.log('Session service initialized');
  }

  /**
   * Create a new session
   * @param shop Shop URL
   * @param accessToken Access token
   * @param scope Scopes granted
   * @param isOnline Whether this is an online token
   * @returns Session ID
   */
  createSession(
    shop: string,
    accessToken: string,
    scope: string,
    isOnline = false,
  ): string {
    // Generate a secure session ID
    const sessionId = this.generateSessionId();

    // Create session object
    const session: Session = {
      id: sessionId,
      shop,
      accessToken,
      scope,
      isOnline,
      createdAt: new Date(),
      // Online tokens expire after 24 hours
      expires: isOnline
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : undefined,
    };

    // Store session
    this.sessions.set(sessionId, session);

    this.logger.log(`Created session for shop: ${shop}`);

    return sessionId;
  }

  /**
   * Get a session by ID
   * @param sessionId Session ID
   * @returns Session or null if not found or expired
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expires && session.expires < new Date()) {
      this.logger.log(`Session ${sessionId} has expired`);
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Delete a session
   * @param sessionId Session ID
   * @returns Whether the session was deleted
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get all sessions for a shop
   * @param shop Shop URL
   * @returns Array of sessions
   */
  getShopSessions(shop: string): Session[] {
    const shopSessions: Session[] = [];

    for (const session of this.sessions.values()) {
      if (session.shop === shop) {
        // Check if session is expired
        if (session.expires && session.expires < new Date()) {
          this.sessions.delete(session.id);
          continue;
        }

        shopSessions.push(session);
      }
    }

    return shopSessions;
  }

  /**
   * Generate a secure session ID
   * @returns Secure session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
