import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RequestWithUser } from './interfaces/request-with-user.interface';

import { RoomService } from './room.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Room } from './entities/room.entity';
import { OwnershipGuard } from './guards/ownership.guard';
import { RoomGateway } from './room.gateway';

@Controller('room')
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private roomGateway: RoomGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async find() {
    return this.roomService.findAll();
  }

  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomService.update(id, updateRoomDto);
  }

  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.roomService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create-group')
  async create(
    @Req() req: RequestWithUser,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    createRoomDto.ownerId = req.user.id;
    const newRoom = await this.roomService.createGroup(createRoomDto);
    await this.roomGateway.server.emit('create-group', {
      list: createRoomDto.member,
    });
    return newRoom;
  }

  @Get('rooms/user/:userId')
  async findRoomsByUserId(@Param('userId') userId: string): Promise<Room[]> {
    return this.roomService.findRoomsByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/add-users/:roomId')
  async addUsersToRoom(
    @Param('roomId') roomId: string,
    @Body() userIds: string[],
    @Req() req: RequestWithUser,
  ) {
    const ownerId = req.user.id;
    const room = await this.roomService.addUsersToRoom(roomId, userIds);
    await this.roomGateway.server.emit('add-user-to-group', {
      list: room.users,
    });
    return room;
  }

  // remove member from room
  // @UseGuards(JwtAuthGuard)
  // @HttpCode(204)
  // @Delete('/delete-members/:roomId')
  // deleteMembersFromRoom(
  //   @Param('roomId') roomId: string,
  //   @Query() query: DeleteMemberRequest,
  //   @Req() req: RequestWithUser,
  // ): any {
  //   return this.roomService.deleteMembersFromRoom(roomId, query, req.user.id);
  // }
}
