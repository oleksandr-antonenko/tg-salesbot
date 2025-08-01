import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ default: 'active' })
  status: string; // active, completed, abandoned

  @Column({ nullable: true })
  completedStage: string; // greeting, situation_discovery, problem_identification, etc.

  @Column({ default: false })
  leadGenerated: boolean;

  @Column({ nullable: true })
  leadScore: number; // 1-10 scoring based on engagement

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @ManyToOne(() => User, (user) => user.conversations)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}
