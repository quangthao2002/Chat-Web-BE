import { Body, Controller, Get, Injectable, Param, Post, UploadedFile, Res, UploadedFiles, UseInterceptors, Put, UsePipes } from '@nestjs/common';

import { MessageService } from './chat.service';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { AWSUploader } from './fileUploader.service';
import { ChatGateway } from './chat.gateway';
import { AddMessageDto } from './dto/add-message.dto';
import { Response } from 'express';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from 'src/room/entities/message.entity';
@Injectable()
@Controller('messages')
export class MessageController {
  private readonly awsUploader: AWSUploader;

  constructor(private readonly messageService: MessageService, private readonly chatGateway: ChatGateway) {
    this.awsUploader = new AWSUploader();
  }
  @UseInterceptors(AnyFilesInterceptor())
  @Post("/uploadFile")
  async uploadFile(@UploadedFiles() files: Array<Express.Multer.File>, @Body() message) {

    const imageUrls = [];
    if (!files) {

      return imageUrls;
    }
    // Loop through each file and upload it to S3
    for (const file of files) {
      try {
        const imgUrl = await this.uploadImage(file, message);
        imageUrls.push(imgUrl);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
    return imageUrls;
  }

  @UseInterceptors(FileInterceptor('avatar'))
  @Post("/uploadImageAndGetUrl")
  async urlImage(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    this.awsUploader.uploadFile(file, (error, data) => {
      if (error) {
        console.error("Error uploading file:", error);
        res.status(500).send({ error });
      } else {
        res.send({ imageUrl: data.Location });
      }
    });
  }

  @Post("/unsendMessage")
  async unsendMessage(@Body('message') message) {
    const unSendmessage = await this.messageService.unsendMessage(message.id);
    const roomId = message?.room?.id
    if(roomId){
      this.chatGateway.server.to(`group-${roomId}`).emit('unsendmessage', unSendmessage);
    }else{
      const clientId = this.chatGateway.connectedUsers.get(message.recipientId);
      this.chatGateway.server.to(clientId).emit('unsendmessage', unSendmessage);
    }
    return true
  }

  @Post("/deleteMessage")
  async deleteMessage(@Body('message') message) {

    const deletedMessage =await this.messageService.deleteMessage(message.id);
    const roomId = message?.room?.id
    if(roomId){
      this.chatGateway.server.to(`group-${roomId}`).emit('deleteMessage', deletedMessage);
    }else{
    const clientId = this.chatGateway.connectedUsers.get(message.recipientId);
    this.chatGateway.server.to(clientId).emit('deleteMessage', deletedMessage);
  }
    return true

  }

  async uploadImage(file, message:AddMessageDto) {
    return new Promise((resolve, reject) => {
      this.awsUploader.uploadFile(file, async (error, data) => {
        if (error) {
          console.error("Error uploading file:", error);
          reject(error);
        } else {
          const imgUrl = data.Location;
          message.text = imgUrl;
          message.roomId = message.roomId=="null" ?  null:message.roomId;
          const newMessage= await this.messageService.addMessage(message);
          if(message.roomId){
            this.chatGateway.server.to(`group-${message.roomId}`).emit('group-message', newMessage);
          }else{
            const clientId = this.chatGateway.connectedUsers.get(message.recipientId);
            this.chatGateway.server.to(clientId).emit('message', newMessage);
          }
          resolve(imgUrl);
        }
      });
    });
}

@Get('/room/:roomId')
getMessagesByRoomId(@Param('roomId') roomId: string) {
  try {
    return this.messageService.getMessagesInRoomById(roomId);
  } catch (error) {
    console.error("error");
  }
}

@Get(':userId/:recipientId')
getMessagesBetweenTwoUsers(@Param('userId') userId: string, @Param('recipientId') recipientId: string) {

  return this.messageService.getMessagesBetweenTwoUsers(userId, recipientId);
}
}
