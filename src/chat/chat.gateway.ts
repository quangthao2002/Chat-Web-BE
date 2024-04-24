import { ForbiddenException, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Socket } from 'socket.io';

import { UserService } from 'src/user/user.service';
import { RoomService } from 'src/room/room.service';
import { AddMessageDto } from './dto/add-message.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { KickUserDto } from './dto/kick-user.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { MessageService } from './chat.service';


const options = {
  cors: {
    origin: [process.env.CORS_PORT ],
    methods: ['GET', 'POST'],
    credentials: true,
  },

};
@UsePipes(new ValidationPipe())
@WebSocketGateway(options)
export class ChatGateway {
  @WebSocketServer()
  server;

  public connectedUsers: Map<string, string> = new Map();

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly roomService: RoomService,
    private readonly messageService: MessageService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.query.token + '';
    const payload = this.authService.verifyAccessToken(token);
    const user = payload && (await this.userService.findOne(payload.id));
    if (user?.id && client?.id) {
      this.connectedUsers.set(user.id, client.id); 
    }
    client.emit('getUsersOnline', Array.from(this.connectedUsers.entries()))  
  }

  async handleDisconnect(client: Socket) {
    for (const [key, val] of this.connectedUsers.entries()) {
      if (val === client.id) {
        this.connectedUsers.delete(key);
          break; 
      }
     }
    client.emit('getUsersOnline', Array.from(this.connectedUsers.entries()));
  }


  @SubscribeMessage('message')
  async onMessage(client: Socket, addMessageDto: AddMessageDto) {
    addMessageDto.userId = addMessageDto.userId; 
    await this.messageService.addMessage(addMessageDto);
      const clientId = this.connectedUsers.get(addMessageDto.recipientId);
      client.to(clientId).emit('message', addMessageDto); // Gửi tin nhắn đến recipientId thay vì roomId
  }

  @SubscribeMessage('group-message')
  async onGroupMessage(client: Socket, addMessageDto: AddMessageDto) {
     const newMessage= await this.messageService.addMessage(addMessageDto);
    if(addMessageDto?.roomId){
      client.to(`group-${addMessageDto.roomId}`).emit('group-message', newMessage);
      
    }
  }
  
  @SubscribeMessage("typing")
  async onTyping(client: Socket, data: any) {

    const clientId = this.connectedUsers.get(data.recipientId);
    client.to(clientId).emit('typing');
  }
  @SubscribeMessage("stopTyping")
  async onStopTyping(client: Socket, data: any) {

    const clientId = this.connectedUsers.get(data.recipientId);
    client.to(clientId).emit('stopTyping');
  }

@SubscribeMessage('join')
async handleJoinRoom(client: Socket, JoinRoomDto: JoinRoomDto) {
    const {roomId} = JoinRoomDto;
    client.join(`group-${roomId}`);

}

  @SubscribeMessage('leave')
  async onRoomLeave(client: Socket, roomId: any) {
    
    client.leave(`group-${roomId}`);
  }

  // @SubscribeMessage('user-kick')
  // async onUserKick(client: Socket, kickUserDto: KickUserDto) {
  //   const { roomId, reason } = kickUserDto;

  //   const userId = this.connectedUsers.get(client.id);
  //   const room = await this.roomService.findOneWithRelations(roomId);

  //   if (userId !== room.ownerId) {
  //     throw new ForbiddenException(`You are not the owner of the room!`);
  //   }

  //   await this.userService.updateUserRoom(kickUserDto.userId, null);

  //   const kickedClient = this.getClientByUserId(kickUserDto.userId);

  //   if (!kickedClient) return;

  //   client.to(kickedClient.id).emit('kicked', reason);
  //   kickedClient.leave(roomId);
  // }

  // @SubscribeMessage('user-ban')
  // async onUserBan(client: Socket, banUserDto: BanUserDto) {
  //   const { roomId, reason } = banUserDto;

  //   const userId = this.connectedUsers.get(client.id);
  //   const room = await this.roomService.findOneWithRelations(roomId);

  //   if (userId !== room.ownerId) {
  //     throw new ForbiddenException(`You are not the owner of the room!`);
  //   }

  //   if (userId === banUserDto.userId) {
  //     throw new ForbiddenException(`You can't ban yourself`);
  //   }

  //   await this.roomService.banUserFromRoom(banUserDto);

  //   const bannedClient = this.getClientByUserId(banUserDto.userId);

  //   if (!bannedClient) return;

  //   client.to(bannedClient.id).emit('banned', reason);
  //   bannedClient.leave(roomId);
  // }

  // private getClientByUserId(userId: string): Socket | null {
  //   for (const [key, value] of this.connectedUsers.entries()) {
  //     if (value === userId) {
  //       const kickedClient = this.server.sockets.sockets.get(key);

  //       return kickedClient;
  //     }
  //   }

  //   return null;
  // }
}
