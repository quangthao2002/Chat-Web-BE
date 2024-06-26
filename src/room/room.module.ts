import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from 'src/user/user.module';

import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';

import { RoomController } from './room.controller';

import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Message]), UserModule],
  controllers: [RoomController],
  providers: [RoomService, RoomGateway],
  exports: [RoomService],
})
export class RoomModule {}
