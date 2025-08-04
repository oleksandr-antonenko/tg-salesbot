import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationService } from './conversation.service';
import { B2CUserService } from './b2c-user.service';
import { User, Conversation, Message, B2CUser } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Conversation, Message, B2CUser])],
  providers: [ConversationService, B2CUserService],
  exports: [ConversationService, B2CUserService],
})
export class DatabaseModule {}
