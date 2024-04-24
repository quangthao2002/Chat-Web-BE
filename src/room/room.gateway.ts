import { UsePipes, ValidationPipe } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { RoomService } from './room.service';
import { Socket } from 'socket.io';

const options = {
  cors: {
    origin: ['http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
};
@UsePipes(new ValidationPipe())
@WebSocketGateway(options)
export class RoomGateway {
  @WebSocketServer()
  server;

  constructor(private readonly userService: RoomService) {}

  async handleConnection(client: Socket, ...args: any[]) {}

  async handleDisconnect(client: Socket) {}

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
