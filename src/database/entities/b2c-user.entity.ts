import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('b2c_users')
export class B2CUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  userId: string; // External user ID (from chat platform, etc.)

  @Column({ nullable: true })
  userName?: string;

  @Column({ nullable: true })
  userProvidedName?: string;

  @Column({ default: 'en' })
  language: string;

  @Column({ default: 'greeting' })
  currentStage: string;

  @Column({ default: 'browsing' })
  purchaseIntent: string; // browsing, considering, ready_to_buy

  // User profile data
  @Column('json', { nullable: true })
  userData: {
    preferences?: string;
    budget?: string;
    urgency?: 'low' | 'medium' | 'high';
    previousPurchases?: string[];
    interests?: string[];
    painPoints?: string[];
    lifestyle?: string;
    demographics?: {
      ageRange?: string;
      location?: string;
      occupation?: string;
    };
  };

  // Tags for segmentation and future upsales
  @Column('simple-array', { default: '' })
  @Index()
  userTags: string[];

  // Engagement metrics
  @Column({ type: 'float', default: 0 })
  averageEngagementScore: number;

  @Column({ default: 0 })
  totalInteractions: number;

  @Column({ default: 0 })
  productViewCount: number;

  @Column({ default: 0 })
  purchaseCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  // Recommended products history
  @Column('json', { nullable: true })
  recommendedProducts?: any[];

  @Column({ nullable: true })
  currentProductFocus?: string;

  // Conversation tracking
  @Column({ nullable: true })
  lastConversationId?: number;

  @Column({ type: 'timestamp', nullable: true })
  lastInteractionAt?: Date;

  // Future upsale opportunities
  @Column('json', { nullable: true })
  upsaleOpportunities?: {
    products?: string[];
    timing?: string;
    priority?: 'low' | 'medium' | 'high';
    reason?: string;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Conversation, (conversation) => conversation.user)
  conversations: Conversation[];

  // Helper methods for tag management
  addTag(tag: string): void {
    if (!this.userTags.includes(tag)) {
      this.userTags.push(tag);
    }
  }

  removeTag(tag: string): void {
    this.userTags = this.userTags.filter(t => t !== tag);
  }

  hasTag(tag: string): boolean {
    return this.userTags.includes(tag);
  }

  getTagsByCategory(category: string): string[] {
    return this.userTags.filter(tag => tag.startsWith(`${category}:`));
  }

  // Helper methods for user segmentation
  isHighValueCustomer(): boolean {
    return this.totalSpent > 500 || this.averageEngagementScore > 7;
  }

  isFrequentBuyer(): boolean {
    return this.purchaseCount >= 3;
  }

  needsFollowUp(): boolean {
    if (!this.lastInteractionAt) return false;
    const daysSinceLastInteraction = Math.floor(
      (Date.now() - this.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceLastInteraction >= 7 && this.purchaseIntent === 'considering';
  }

  getPersonalizationContext(): any {
    return {
      preferences: this.userData?.preferences,
      interests: this.userData?.interests,
      budget: this.userData?.budget,
      previousPurchases: this.userData?.previousPurchases,
      tags: this.userTags,
      engagementLevel: this.averageEngagementScore > 5 ? 'high' : 'low',
      purchaseHistory: {
        count: this.purchaseCount,
        totalSpent: this.totalSpent,
        isFrequentBuyer: this.isFrequentBuyer(),
      },
    };
  }
}