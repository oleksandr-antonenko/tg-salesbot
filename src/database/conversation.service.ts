import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Conversation, Message } from './entities';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async findOrCreateUser(telegramId: string, userInfo: {
    username?: string;
    firstName?: string;
    lastName?: string;
    language?: string;
  }): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { telegramId }
    });

    if (!user) {
      user = this.userRepository.create({
        telegramId,
        username: userInfo.username,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        language: userInfo.language || 'en',
      });
      await this.userRepository.save(user);
      this.logger.log(`New user created: ${telegramId}`);
    } else {
      // Обновляем информацию о пользователе если изменилась
      let hasChanges = false;
      if (userInfo.username && user.username !== userInfo.username) {
        user.username = userInfo.username;
        hasChanges = true;
      }
      if (userInfo.firstName && user.firstName !== userInfo.firstName) {
        user.firstName = userInfo.firstName;
        hasChanges = true;
      }
      if (userInfo.language && user.language !== userInfo.language) {
        user.language = userInfo.language;
        hasChanges = true;
      }
      
      if (hasChanges) {
        await this.userRepository.save(user);
      }
    }

    return user;
  }

  async updateUserData(userId: number, data: {
    businessType?: string;
    currentChallenges?: string;
    budget?: string;
    timeline?: string;
    contactInfo?: string;
    conversationStage?: string;
    language?: string;
  }): Promise<void> {
    await this.userRepository.update(userId, data);
  }

  async clearUserData(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      businessType: undefined,
      currentChallenges: undefined,
      budget: undefined,
      timeline: undefined,
      contactInfo: undefined,
      conversationStage: 'language_selection',
    });
  }

  async startConversation(userId: number): Promise<Conversation> {
    // Закрываем предыдущий разговор если есть активный
    await this.conversationRepository.update(
      { userId, status: 'active' },
      { status: 'abandoned', endedAt: new Date() }
    );

    const conversation = this.conversationRepository.create({
      userId,
      status: 'active',
    });

    return await this.conversationRepository.save(conversation);
  }

  async getCurrentConversation(userId: number): Promise<Conversation | null> {
    return await this.conversationRepository.findOne({
      where: { userId, status: 'active' },
      relations: ['messages']
    });
  }

  async logMessage(
    conversationId: number,
    messageType: 'user' | 'bot',
    content: string,
    conversationStage?: string,
    aiModel?: string,
    metadata?: any
  ): Promise<Message> {
    const message = this.messageRepository.create({
      conversationId,
      messageType,
      content,
      conversationStage,
      aiModel,
      metadata,
    });

    return await this.messageRepository.save(message);
  }

  async updateConversationStage(conversationId: number, stage: string): Promise<void> {
    await this.conversationRepository.update(conversationId, {
      completedStage: stage,
    });
  }

  async completeConversation(conversationId: number, leadGenerated: boolean = false, leadScore?: number): Promise<void> {
    await this.conversationRepository.update(conversationId, {
      status: 'completed',
      endedAt: new Date(),
      leadGenerated,
      leadScore,
    });
  }

  async getConversationHistory(userId: number, limit: number = 10): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      where: { userId },
      relations: ['messages'],
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }

  async getConversationStats(): Promise<{
    totalConversations: number;
    activeConversations: number;
    completedConversations: number;
    leadsGenerated: number;
    averageLeadScore: number;
  }> {
    const totalConversations = await this.conversationRepository.count();
    const activeConversations = await this.conversationRepository.count({
      where: { status: 'active' }
    });
    const completedConversations = await this.conversationRepository.count({
      where: { status: 'completed' }
    });
    const leadsGenerated = await this.conversationRepository.count({
      where: { leadGenerated: true }
    });

    const avgResult = await this.conversationRepository
      .createQueryBuilder('conversation')
      .select('AVG(conversation.leadScore)', 'avg')
      .where('conversation.leadScore IS NOT NULL')
      .getRawOne();

    return {
      totalConversations,
      activeConversations,
      completedConversations,
      leadsGenerated,
      averageLeadScore: parseFloat(avgResult?.avg || '0'),
    };
  }
}