import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from './user.service';
import { UsePipes, ValidationPipe } from '@nestjs/common';

const options = {
  cors: {
    origin: ['http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
};
@UsePipes(new ValidationPipe())
@WebSocketGateway(options)
export class UserGateway {
  @WebSocketServer()
  server;

  constructor(private readonly userService: UserService) {}

  async handleConnection(client: Socket, ...args: any[]) {}

  async handleDisconnect(client: Socket) {}

  @SubscribeMessage('send-friend-request')
  async handleFriendRequest(
    client: Socket,
    payload: { senderId: string; receiverId: string },
  ) {
    try {
      await this.userService.sendFriendRequest(
        payload.senderId,
        payload.receiverId,
      );

      // Emit a 'friend-request-sent' event
      this.server
        .to(payload.receiverId)
        .emit('friend-request-sent', { receiverId: payload.receiverId });
    } catch (error) {
      console.log('[ Friend ] Error in sendFriendRequest: ', error.message);
    }
  }

  @SubscribeMessage('accept-friend-request')
  async handleAcceptFriendRequest(
    client: Socket,
    payload: { senderId: string; receiverId: string },
  ) {
    try {
      await this.userService.acceptFriendRequest(
        payload.senderId,
        payload.receiverId,
      );

      // Emit a 'friend-request-accepted' event
      client.emit('friend-request-accepted', payload);
    } catch (error) {
      console.log('[ Friend ] Error in acceptFriendRequest: ', error.message);
    }
  }

  @SubscribeMessage('get-list-friend-request-pending')
  async handleGetListFriendRequestPending(
    client: Socket,
    payload: { senderId: string },
  ) {
    try {
      const friendRequests = await this.userService.getListFriendRequestPending(
        payload.senderId,
      );

      // Emit a 'list-friend-request-pending' event
      client.emit('list-friend-request-pending', friendRequests);
    } catch (error) {
      console.log(
        '[ Friend ] Error in getListFriendRequestPending: ',
        error.message,
      );
    }
  }

  @SubscribeMessage('get-friends')
  async handleGetFriend(client: Socket, payload: { userId: string }) {
    try {
      const friendData = await this.userService.getFriends(payload.userId);

      // Emit a 'friend-data' event with the friend data
      client.emit('friend-data', friendData);
    } catch (error) {
      console.log('[ Friend ] Error in getFriend: ', error.message);
    }
  }
}
