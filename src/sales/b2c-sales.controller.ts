import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { B2CSalesService } from './b2c-sales.service';
import { ShopifyAuthGuard } from '../auth/shopify-auth.guard';
import { Shop } from '../shop/shop.decorator';
import { Shop as ShopEntity } from '../shop/shop.entity';

interface B2CChatRequest {
  message: string;
  sessionId: string;
  userId?: string;
  language?: string;
  conversationHistory?: Array<{ role: 'user' | 'bot'; message: string }>;
}

interface B2CChatResponse {
  response: string;
  sessionData?: any;
  engagementScore?: number;
  recommendedProducts?: any[];
  nextAction?: string;
  userTags?: string[];
}

@Controller('b2c-sales')
@UseGuards(ShopifyAuthGuard)
export class B2CSalesController {
  private readonly logger = new Logger(B2CSalesController.name);
  private sessions = new Map<string, any>(); // In production, use Redis or database

  constructor(private readonly b2cSalesService: B2CSalesService) {}

  @Post('chat')
  async processChat(
    @Body() chatRequest: B2CChatRequest,
    @Shop() shop: ShopEntity,
  ): Promise<B2CChatResponse> {
    try {
      this.logger.log(`Processing B2C chat for shop: ${shop.shopUrl}`);

      if (!chatRequest.message || !chatRequest.sessionId) {
        throw new BadRequestException('Message and sessionId are required');
      }

      // Get or create session
      let session = this.sessions.get(chatRequest.sessionId);
      if (!session) {
        // Detect language from first message or use provided language
        const detectedLanguage = chatRequest.language || 
          await this.b2cSalesService.detectLanguage(chatRequest.message);

        session = {
          userId: chatRequest.userId || chatRequest.sessionId,
          userName: undefined,
          userProvidedName: undefined,
          language: detectedLanguage,
          conversationStage: 'greeting',
          conversationId: undefined,
          dbUserId: undefined,
          userData: {},
          userTags: [],
          recommendedProducts: [],
          currentProductFocus: undefined,
          purchaseIntent: 'browsing',
        };
        this.sessions.set(chatRequest.sessionId, session);
      }

      // Process the message
      const result = await this.b2cSalesService.processMessage(
        chatRequest.message,
        session,
        chatRequest.conversationHistory,
        shop, // Pass shop context for product recommendations
      );

      // Update session with new data
      if (result.updatedSession) {
        Object.assign(session, result.updatedSession);
        this.sessions.set(chatRequest.sessionId, session);
      }

      return {
        response: result.message,
        sessionData: {
          stage: session.conversationStage,
          language: session.language,
          userTags: session.userTags,
          purchaseIntent: session.purchaseIntent,
        },
        engagementScore: result.engagementScore,
        recommendedProducts: result.recommendedProducts,
        nextAction: result.nextAction,
        userTags: session.userTags,
      };
    } catch (error) {
      this.logger.error('Error processing B2C chat:', error);
      throw new BadRequestException('Failed to process chat message');
    }
  }

  @Post('initialize')
  async initializeSession(
    @Body() initRequest: { sessionId: string; language?: string },
    @Shop() shop: ShopEntity,
  ): Promise<{ welcomeMessage: string; sessionId: string }> {
    try {
      const language = initRequest.language || 'en';
      const welcomeMessage = await this.b2cSalesService.generateWelcomeMessage(language);

      // Create new session
      const session = {
        userId: initRequest.sessionId,
        userName: undefined,
        userProvidedName: undefined,
        language,
        conversationStage: 'greeting',
        conversationId: undefined,
        dbUserId: undefined,
        userData: {},
        userTags: [],
        recommendedProducts: [],
        currentProductFocus: undefined,
        purchaseIntent: 'browsing',
      };

      this.sessions.set(initRequest.sessionId, session);

      return {
        welcomeMessage,
        sessionId: initRequest.sessionId,
      };
    } catch (error) {
      this.logger.error('Error initializing B2C session:', error);
      throw new BadRequestException('Failed to initialize session');
    }
  }

  @Get('session/:sessionId')
  async getSession(@Param('sessionId') sessionId: string): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new BadRequestException('Session not found');
      }

      return {
        sessionId,
        stage: session.conversationStage,
        language: session.language,
        userData: session.userData,
        userTags: session.userTags,
        recommendedProducts: session.recommendedProducts,
        currentProductFocus: session.currentProductFocus,
        purchaseIntent: session.purchaseIntent,
      };
    } catch (error) {
      this.logger.error('Error getting B2C session:', error);
      throw new BadRequestException('Failed to get session');
    }
  }

  @Post('session/:sessionId/tags')
  async addUserTags(
    @Param('sessionId') sessionId: string,
    @Body() tagsRequest: { tags: string[] },
  ): Promise<{ success: boolean; userTags: string[] }> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new BadRequestException('Session not found');
      }

      // Add new tags (avoid duplicates)
      const newTags = tagsRequest.tags.filter(tag => !session.userTags.includes(tag));
      session.userTags.push(...newTags);

      this.sessions.set(sessionId, session);

      return {
        success: true,
        userTags: session.userTags,
      };
    } catch (error) {
      this.logger.error('Error adding user tags:', error);
      throw new BadRequestException('Failed to add user tags');
    }
  }

  @Get('analytics/:conversationId')
  async getConversationAnalytics(
    @Param('conversationId') conversationId: string,
  ): Promise<any> {
    try {
      const id = parseInt(conversationId);
      if (isNaN(id)) {
        throw new BadRequestException('Invalid conversation ID');
      }

      const analytics = await this.b2cSalesService.getB2CAnalytics(id);
      return analytics;
    } catch (error) {
      this.logger.error('Error getting B2C analytics:', error);
      throw new BadRequestException('Failed to get analytics');
    }
  }

  @Post('recommendations')
  async getProductRecommendations(
    @Body() recommendationRequest: {
      sessionId: string;
      preferences?: string[];
      budget?: string;
      interests?: string[];
    },
    @Shop() shop: ShopEntity,
  ): Promise<{ recommendations: any[] }> {
    try {
      const session = this.sessions.get(recommendationRequest.sessionId);
      if (!session) {
        throw new BadRequestException('Session not found');
      }

      // Update session with additional preference data
      if (recommendationRequest.preferences) {
        session.userData.preferences = recommendationRequest.preferences.join(', ');
        recommendationRequest.preferences.forEach(pref => {
          if (!session.userTags.includes(`pref:${pref.toLowerCase()}`)) {
            session.userTags.push(`pref:${pref.toLowerCase()}`);
          }
        });
      }

      if (recommendationRequest.budget) {
        session.userData.budget = recommendationRequest.budget;
        session.userTags.push(`budget:${recommendationRequest.budget.toLowerCase()}`);
      }

      if (recommendationRequest.interests) {
        session.userData.interests = [
          ...(session.userData.interests || []),
          ...recommendationRequest.interests,
        ];
        recommendationRequest.interests.forEach(interest => {
          if (!session.userTags.includes(`interest:${interest.toLowerCase()}`)) {
            session.userTags.push(`interest:${interest.toLowerCase()}`);
          }
        });
      }

      // Get product recommendations using the service's private method
      // We'll simulate this since the method is private
      const mockRecommendations = []; // In real implementation, this would call a public method

      this.sessions.set(recommendationRequest.sessionId, session);

      return {
        recommendations: mockRecommendations,
      };
    } catch (error) {
      this.logger.error('Error getting product recommendations:', error);
      throw new BadRequestException('Failed to get recommendations');
    }
  }

  @Post('session/:sessionId/clear')
  async clearSession(@Param('sessionId') sessionId: string): Promise<{ success: boolean }> {
    try {
      const deleted = this.sessions.delete(sessionId);
      return { success: deleted };
    } catch (error) {
      this.logger.error('Error clearing B2C session:', error);
      throw new BadRequestException('Failed to clear session');
    }
  }

  @Get('sessions/active')
  async getActiveSessions(): Promise<{ count: number; sessions: any[] }> {
    try {
      const activeSessions = Array.from(this.sessions.entries()).map(([sessionId, session]) => ({
        sessionId,
        stage: session.conversationStage,
        language: session.language,
        userTags: session.userTags,
        purchaseIntent: session.purchaseIntent,
        lastActive: new Date(), // In real implementation, track this properly
      }));

      return {
        count: activeSessions.length,
        sessions: activeSessions,
      };
    } catch (error) {
      this.logger.error('Error getting active sessions:', error);
      throw new BadRequestException('Failed to get active sessions');
    }
  }
}