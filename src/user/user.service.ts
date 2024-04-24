import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Brackets, Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { Room } from 'src/room/entities/room.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Friend } from './entities/friend.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Friend)
    private readonly friendRepository: Repository<Friend>,
  ) {}

  async findAll() {
    const users = await this.userRepository.find();

    return users;
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne(id, {
      relations: ['rooms'],
    });

    if (!user) {
      throw new NotFoundException(`There is no user under id ${id}`);
    }

    return user;
  }

  async findOneByUsername(username: string) {
    const user = await this.userRepository.findOne({ username });

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.userRepository.create({
      ...createUserDto,
    });

    return this.userRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });

    if (!user) {
      throw new NotFoundException(`There is no user under id ${id}`);
    }

    return this.userRepository.save(user);
  }

  async updateUserRoom(id: string, room: Room) {
    const user = await this.userRepository.preload({
      id,
      rooms: [room],
    });

    if (!user) {
      throw new NotFoundException(`There is no user under id ${id}`);
    }

    const isBanned = user.bannedRooms?.find(
      (bannedRoom) => bannedRoom.id === room?.id,
    );

    if (isBanned) {
      throw new ForbiddenException(`You have been banned from this room`);
    }

    return this.userRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    return this.userRepository.remove(user);
  }

  async getUserForSidebar(userId: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.avatar'])
      .where('user.id != :id', { id: userId })
      .getMany();
  }

  async findUsersByIds(member: string[]): Promise<User[]> {
    return await this.userRepository.findByIds(member);
  }

  async sendFriendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<Friend> {
    const sender = await this.userRepository.findOne(senderId);
    const receiver = await this.userRepository.findOne(receiverId);

    if (!sender || !receiver) {
      throw new Error('User not found');
    }

    const existingFriendRequest = await this.friendRepository
      .createQueryBuilder('friend')
      .where('friend.senderId = :senderId', { senderId: senderId })
      .andWhere('friend.receiverId = :receiverId', { receiverId: receiverId })
      .getOne();

    if (existingFriendRequest) {
      throw new Error('Friend request already exists');
    }

    const friendRequest = this.friendRepository.create({
      sender,
      receiver,
      status: 'pending',
    });

    return this.friendRepository.save(friendRequest);
  }

  async acceptFriendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<Friend> {
    const sender = await this.userRepository.findOne(senderId);
    const receiver = await this.userRepository.findOne(receiverId);

    if (!sender || !receiver) {
      throw new Error('User not found');
    }

    const friendRequest = await this.friendRepository
      .createQueryBuilder('friend')
      .where('friend.senderId = :senderId', { senderId: senderId })
      .andWhere('friend.receiverId = :receiverId', { receiverId: receiverId })
      .getOne();

    if (!friendRequest) {
      throw new Error('Friend request not found');
    }

    if (friendRequest.status !== 'pending') {
      throw new Error('Friend request is not pending');
    }

    friendRequest.status = 'accepted';

    return this.friendRepository.save(friendRequest);
  }

  async getListFriendRequestPending(senderId: string) {
    return this.friendRepository
      .createQueryBuilder('friend')
      .leftJoinAndSelect('friend.sender', 'sender')
      .leftJoinAndSelect('friend.receiver', 'receiver')
      .where('friend.sender.id != :senderId', { senderId })
      .andWhere('friend.status = :status', { status: 'pending' })
      .select([
        'friend.id',
        'friend.status',
        'sender.id',
        'sender.username',
        'sender.avatar',
        'sender.phone',
      ])
      .getMany();
  }

  async getFriends(userId: string) {
    return await this.friendRepository
      .createQueryBuilder('friend')
      .select(['friend.id', 'sender.id', 'sender.username', 'sender.avatar'])
      .innerJoin('friend.sender', 'sender')
      .innerJoin('friend.receiver', 'receiver')
      .where('friend.status = :status', { status: 'accepted' })
      .andWhere(
        new Brackets((qb) => {
          qb.where('sender.id = :id', { id: userId }).orWhere(
            'receiver.id = :id',
            { id: userId },
          );
        }),
      )
      .select([
        'friend.id',
        'friend.status',
        'sender.id',
        'sender.username',
        'sender.avatar',
        'sender.phone',
        'receiver.id',
        'receiver.username',
        'receiver.avatar',
        'receiver.phone',
      ])
      .getMany();
  }

  async searchUser(phone: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.phone LIKE :phone', { phone: `%${phone}%` })
      .select(['user.id', 'user.username', 'user.avatar'])
      .getOne();
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<User> {
    const user = await this.userRepository.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.avatar = avatarUrl;
    await this.userRepository.save(user);
    return user;
  }
  async updateProfile(
    userId: string,
    fullName: string,
    phone: string,
    email: string,
  ) {
    const user = await this.userRepository.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.fullName = fullName;
    user.phone = phone;
    user.email = email;

    await this.userRepository.save(user);
    return user;
  }
  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    return user;
  }
  async findByPhone(phone: string) {
    const user = await this.userRepository.findOne({ where: { phone } });
    return user;
  }
}
