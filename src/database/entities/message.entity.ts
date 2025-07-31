import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  conversationId: number;

  @Column()
  messageType: string; // 'user' or 'bot'

  @Column('text')
  content: string;

  @Column({ nullable: true })
  conversationStage: string; // stage when message was sent

  @Column({ nullable: true })
  aiModel: string; // which AI model was used (gemini-pro, etc.)

  @Column({ type: 'json', nullable: true })
  metadata: any; // additional data like user data at time of message

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Conversation, conversation => conversation.messages)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;
}