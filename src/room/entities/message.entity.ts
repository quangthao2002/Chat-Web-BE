import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinTable,
} from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { Room } from './room.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 250 })
  text: string;

  @Column({default:null})
  recipientId: string

  @Column({ default: false })
  isDeleted: boolean

  @Column ({default:false})
  isUnsend: boolean
  
  @Column({ default: false })
  isSeen: boolean
  
  @CreateDateColumn()
  created_at: Date;
  
  @JoinTable()
  @ManyToOne(() => Room, (room: Room) => room.messages)
  room: Room;

  @JoinTable()
  @ManyToOne(() => User, (user: User) => user.messages)
  user: User;
}
