import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinTable,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Room } from 'src/room/entities/room.entity';
import { Message } from 'src/room/entities/message.entity';
import { Friend } from './friend.entity'; // Ensure the import path is correct

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  username: string;

  @Column({ length: 60 })
  password: string;

  @Column({ length: 60 })
  phone: string;

  @Column({ unique: true,nullable: true })
  email: string;

  @Column({ length: 20 })
  fullName: string;

  @Column()
  avatar: string;

  @Column({ default: false })
  is_verify: boolean;

  @Column()
  is_admin: boolean;
  @ManyToMany(() => Room, room => room.users)
  rooms: Room[];

  @JoinTable()
  @ManyToMany(() => Room, (room: Room) => room.bannedUsers, { eager: true })
  bannedRooms: Array<Room>;

  @OneToMany(() => Message, (message: Message) => message.user)
  messages: Array<Message>;

  @OneToMany(() => Friend, (friend: Friend) => friend.sender)
  sentFriendRequests: Array<Friend>;

  @OneToMany(() => Friend, (friend: Friend) => friend.receiver)
  receivedFriendRequests: Array<Friend>;
}
