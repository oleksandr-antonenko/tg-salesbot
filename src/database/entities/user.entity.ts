import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  telegramId: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ default: 'en' })
  language: string;

  @Column({ nullable: true })
  businessType?: string;

  @Column({ nullable: true })
  currentChallenges?: string;

  @Column({ nullable: true })
  budget?: string;

  @Column({ nullable: true })
  timeline?: string;

  @Column({ nullable: true })
  contactInfo?: string;

  @Column({ default: 'language_selection' })
  conversationStage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Conversation, (conversation) => conversation.user)
  conversations: Conversation[];
}
