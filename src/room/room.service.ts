import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UserService } from 'src/user/user.service';

import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';

import { AddMessageDto } from 'src/chat/dto/add-message.dto';
import { CreateRoomDto } from 'src/room/dto/create-room.dto';
import { UpdateRoomDto } from 'src/room/dto/update-room.dto';
import { BanUserDto } from 'src/chat/dto/ban-user.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly userService: UserService,
  ) {}

  async findAll() {
    const rooms = await this.roomRepository.find({ relations: ['messages'] });

    return rooms;
  }

  async findOne(id: string) {
    const room = await this.roomRepository.findOne(id);

    if (!room) {
      throw new NotFoundException(`There is no room under id ${id}`);
    }

    return room;
  }

  async findOneWithRelations(id: string) {
    const room = await this.roomRepository.findOne(id, {
      relations: ['messages', 'users', 'bannedUsers'],
    });

    if (!room) {
      throw new NotFoundException(`There is no room under id ${id}`);
    }

    return room;
  }

  async findOneByName(name: string) {
    const room = await this.roomRepository.findOne({ name });

    return room;
  }

  async create(createRoomDto: CreateRoomDto) {
    const room = await this.roomRepository.create({
      ...createRoomDto,
    });

    return this.roomRepository.save(room);
  }

  async addMessage(addMessageDto: AddMessageDto) {
    const { roomId, userId, text } = addMessageDto;

    const room = await this.findOne(roomId);
    const user = await this.userService.findOne(userId);

    const message = await this.messageRepository.create({
      text,
      room,
      user,
    });

    return this.messageRepository.save(message);
  }

  async update(id: string, updateRoomDto: UpdateRoomDto) {
    const room = await this.roomRepository.preload({
      id,
      ...updateRoomDto,
    });

    if (!room) {
      throw new NotFoundException(`There is no room under id ${id}`);
    }

    return this.roomRepository.save(room);
  }

  async banUserFromRoom(banUserDto: BanUserDto) {
    const { userId, roomId } = banUserDto;

    const user = await this.userService.findOne(userId);
    const room = await this.findOne(roomId);

    await this.userService.updateUserRoom(userId, null);

    const bannedUsers = { ...room.bannedUsers, ...user };
    const updatedRoom = await this.roomRepository.preload({
      id: roomId,
      bannedUsers,
    });

    return this.roomRepository.save(updatedRoom);
  }

  async remove(id: string) {
    const room = await this.findOne(id);
    return this.roomRepository.remove(room);
  }

  async createGroup(createRoomDto: CreateRoomDto): Promise<Room> {
    const newRoom = this.roomRepository.create({
      name: createRoomDto.name,
      avatar: createRoomDto.avatar,
      ownerId: createRoomDto.ownerId,
    });

    newRoom.users = await this.userService.findUsersByIds(createRoomDto.member); // tim tat ca user trong danh sach userids
    await this.roomRepository.save(newRoom);
    return newRoom;
  }

  // Tim tat ca room cua 1 user
  async findRoomsByUserId(userId: string): Promise<Room[]> {
    return this.roomRepository
      .createQueryBuilder('room')
      .innerJoinAndSelect('room.users', 'user', 'user.id = :userId', { userId }) // Join with users table
      .leftJoinAndSelect('room.users', 'users') // Add this line to fetch users in the room
      .getMany();
  }

  async addUsersToRoom(roomId: string, userIds: string[]): Promise<Room> {
    const room = await this.roomRepository.findOne(roomId, {
      relations: ['users'],
    });

    if (!room) {
      throw new Error('Room not found');
    }

    for (const userId of userIds) {
      const user = await this.userService.findOne(userId);

      if (!user) {
        throw new Error(`User with id ${userId} not found`);
      }

      room.users.push(user);
    }

    await this.roomRepository.save(room);
    return room;
  }
}
