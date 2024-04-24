import { Module } from '@nestjs/common';

import { ChatGateway } from './chat.gateway';

import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { RoomModule } from 'src/room/room.module';
import { MessageService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from 'src/room/entities/message.entity';
import { MessageController } from './chat.controller';

@Module({
  controllers: [MessageController,],
  imports: [UserModule, AuthModule, RoomModule,TypeOrmModule.forFeature([Message])],
  providers: [ChatGateway,MessageService],
})
export class ChatModule {}
