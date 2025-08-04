import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { B2CUser } from './entities/b2c-user.entity';

@Injectable()
export class B2CUserService {
  private readonly logger = new Logger(B2CUserService.name);

  constructor(
    @InjectRepository(B2CUser)
    private readonly b2cUserRepository: Repository<B2CUser>,
  ) {}

  async findOrCreateUser(userId: string): Promise<B2CUser> {
    try {
      let user = await this.b2cUserRepository.findOne({
        where: { userId },
      });

      if (!user) {
        user = this.b2cUserRepository.create({
          userId,
          userData: {},
          userTags: [],
          averageEngagementScore: 0,
          totalInteractions: 0,
          productViewCount: 0,
          purchaseCount: 0,
          totalSpent: 0,
        });
        user = await this.b2cUserRepository.save(user);
        this.logger.log(`Created new B2C user: ${userId}`);
      }

      return user;
    } catch (error) {
      this.logger.error(`Error finding/creating B2C user ${userId}:`, error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<B2CUser>): Promise<B2CUser> {
    try {
      const user = await this.findOrCreateUser(userId);
      Object.assign(user, updates);
      user.lastInteractionAt = new Date();
      
      const savedUser = await this.b2cUserRepository.save(user);
      this.logger.log(`Updated B2C user: ${userId}`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Error updating B2C user ${userId}:`, error);
      throw error;
    }
  }

  async addUserTags(userId: string, tags: string[]): Promise<B2CUser> {
    try {
      const user = await this.findOrCreateUser(userId);
      
      tags.forEach(tag => user.addTag(tag));
      
      const savedUser = await this.b2cUserRepository.save(user);
      this.logger.log(`Added tags to B2C user ${userId}: ${tags.join(', ')}`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Error adding tags to B2C user ${userId}:`, error);
      throw error;
    }
  }

  async updateEngagementScore(userId: string, score: number): Promise<void> {
    try {
      const user = await this.findOrCreateUser(userId);
      
      // Calculate running average
      const totalScore = user.averageEngagementScore * user.totalInteractions + score;
      user.totalInteractions += 1;
      user.averageEngagementScore = totalScore / user.totalInteractions;
      
      await this.b2cUserRepository.save(user);
      this.logger.log(`Updated engagement score for B2C user ${userId}: ${user.averageEngagementScore}`);
    } catch (error) {
      this.logger.error(`Error updating engagement score for B2C user ${userId}:`, error);
      throw error;
    }
  }

  async recordProductView(userId: string, productId: string): Promise<void> {
    try {
      const user = await this.findOrCreateUser(userId);
      user.productViewCount += 1;
      user.addTag(`viewed:${productId}`);
      
      await this.b2cUserRepository.save(user);
      this.logger.log(`Recorded product view for B2C user ${userId}: ${productId}`);
    } catch (error) {
      this.logger.error(`Error recording product view for B2C user ${userId}:`, error);
      throw error;
    }
  }

  async recordPurchase(userId: string, productId: string, amount: number): Promise<void> {
    try {
      const user = await this.findOrCreateUser(userId);
      user.purchaseCount += 1;
      user.totalSpent = parseFloat(user.totalSpent.toString()) + amount;
      user.addTag(`purchased:${productId}`);
      user.addTag('customer:paid');
      
      // Update purchase intent
      user.purchaseIntent = 'ready_to_buy';
      
      await this.b2cUserRepository.save(user);
      this.logger.log(`Recorded purchase for B2C user ${userId}: ${productId} ($${amount})`);
    } catch (error) {
      this.logger.error(`Error recording purchase for B2C user ${userId}:`, error);
      throw error;
    }
  }

  async getUsersByTags(tags: string[]): Promise<B2CUser[]> {
    try {
      const queryBuilder = this.b2cUserRepository.createQueryBuilder('user');
      
      tags.forEach((tag, index) => {
        if (index === 0) {
          queryBuilder.where('user.userTags LIKE :tag0', { [`tag${index}`]: `%${tag}%` });
        } else {
          queryBuilder.orWhere(`user.userTags LIKE :tag${index}`, { [`tag${index}`]: `%${tag}%` });
        }
      });
      
      const users = await queryBuilder.getMany();
      this.logger.log(`Found ${users.length} B2C users with tags: ${tags.join(', ')}`);
      return users;
    } catch (error) {
      this.logger.error(`Error finding B2C users by tags:`, error);
      throw error;
    }
  }

  async getHighValueCustomers(): Promise<B2CUser[]> {
    try {
      const users = await this.b2cUserRepository.find({
        where: [
          { averageEngagementScore: 7 }, // Use exact value since TypeORM doesn't support >= in simple find
          { purchaseCount: 3 },
        ],
        order: { totalSpent: 'DESC' },
        take: 100,
      });
      
      // Filter for high value customers using the entity method
      const highValueUsers = users.filter(user => user.isHighValueCustomer());
      
      this.logger.log(`Found ${highValueUsers.length} high-value B2C customers`);
      return highValueUsers;
    } catch (error) {
      this.logger.error(`Error finding high-value B2C customers:`, error);
      throw error;
    }
  }

  async getUsersNeedingFollowUp(): Promise<B2CUser[]> {
    try {
      const users = await this.b2cUserRepository.find({
        where: { purchaseIntent: 'considering' },
        order: { lastInteractionAt: 'ASC' },
      });
      
      // Filter for users needing follow-up using the entity method
      const followUpUsers = users.filter(user => user.needsFollowUp());
      
      this.logger.log(`Found ${followUpUsers.length} B2C users needing follow-up`);
      return followUpUsers;
    } catch (error) {
      this.logger.error(`Error finding B2C users needing follow-up:`, error);
      throw error;
    }
  }

  async updateUpsaleOpportunities(userId: string, opportunities: any[]): Promise<void> {
    try {
      const user = await this.findOrCreateUser(userId);
      user.upsaleOpportunities = opportunities;
      
      await this.b2cUserRepository.save(user);
      this.logger.log(`Updated upsale opportunities for B2C user ${userId}`);
    } catch (error) {
      this.logger.error(`Error updating upsale opportunities for B2C user ${userId}:`, error);
      throw error;
    }
  }

  async getUserAnalytics(userId: string): Promise<{
    profile: any;
    engagementHistory: any;
    purchaseHistory: any;
    recommendations: any;
    upsaleOpportunities: any;
  }> {
    try {
      const user = await this.b2cUserRepository.findOne({
        where: { userId },
        relations: ['conversations'],
      });

      if (!user) {
        throw new Error(`B2C User ${userId} not found`);
      }

      return {
        profile: user.getPersonalizationContext(),
        engagementHistory: {
          averageScore: user.averageEngagementScore,
          totalInteractions: user.totalInteractions,
          productViews: user.productViewCount,
          lastInteraction: user.lastInteractionAt,
        },
        purchaseHistory: {
          purchaseCount: user.purchaseCount,
          totalSpent: user.totalSpent,
          isFrequentBuyer: user.isFrequentBuyer(),
          isHighValue: user.isHighValueCustomer(),
        },
        recommendations: {
          current: user.recommendedProducts,
          currentFocus: user.currentProductFocus,
        },
        upsaleOpportunities: user.upsaleOpportunities || [],
      };
    } catch (error) {
      this.logger.error(`Error getting analytics for B2C user ${userId}:`, error);
      throw error;
    }
  }

  async getSegmentAnalytics(): Promise<{
    totalUsers: number;
    segmentBreakdown: any;
    topTags: any[];
    engagementStats: any;
    revenueStats: any;
  }> {
    try {
      const totalUsers = await this.b2cUserRepository.count();
      
      const users = await this.b2cUserRepository.find();
      
      // Analyze segments
      const segments = {
        highValue: users.filter(u => u.isHighValueCustomer()).length,
        frequentBuyers: users.filter(u => u.isFrequentBuyer()).length,
        needsFollowUp: users.filter(u => u.needsFollowUp()).length,
        newUsers: users.filter(u => u.totalInteractions <= 3).length,
      };

      // Analyze tags
      const tagCounts = new Map<string, number>();
      users.forEach(user => {
        user.userTags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });
      
      const topTags = Array.from(tagCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([tag, count]) => ({ tag, count }));

      // Calculate stats
      const engagementStats = {
        averageScore: users.reduce((sum, u) => sum + u.averageEngagementScore, 0) / users.length,
        totalInteractions: users.reduce((sum, u) => sum + u.totalInteractions, 0),
        totalProductViews: users.reduce((sum, u) => sum + u.productViewCount, 0),
      };

      const revenueStats = {
        totalRevenue: users.reduce((sum, u) => sum + parseFloat(u.totalSpent.toString()), 0),
        totalPurchases: users.reduce((sum, u) => sum + u.purchaseCount, 0),
        averageOrderValue: users.reduce((sum, u) => sum + parseFloat(u.totalSpent.toString()), 0) / 
                          Math.max(users.reduce((sum, u) => sum + u.purchaseCount, 0), 1),
      };

      return {
        totalUsers,
        segmentBreakdown: segments,
        topTags,
        engagementStats,
        revenueStats,
      };
    } catch (error) {
      this.logger.error(`Error getting segment analytics:`, error);
      throw error;
    }
  }
}