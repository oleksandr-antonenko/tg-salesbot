import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationService } from './conversation.service';
import { User, Conversation, Message } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Conversation, Message])],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class DatabaseModule {}