import {
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  UseGuards,
  Request,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from 'src/auth/auth.service';
import { AWSUploader } from 'src/chat/fileUploader.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3 } from 'aws-sdk';
import { UserGateway } from './user.gateway';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private authService: AuthService,
    private readonly awsUploader: AWSUploader,
    private userGateway: UserGateway,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('/users-sidebar')
  async getUserForSidebar(@Request() req) {
    try {
      const loggedInUser = req.user.id;
      const filteredUsers = await this.userService.getUserForSidebar(
        loggedInUser,
      );
      return filteredUsers;
    } catch (error) {
   
      throw new InternalServerErrorException('Internal server error');
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/refresh-token')
  async refreshToken(@Body() refresh_token: string) {
    try {
      const newAccessToken = await this.authService.refreshToken(refresh_token);
      return { accessToken: newAccessToken };
    } catch (error) {
      
      throw new InternalServerErrorException('Internal server error');
    }
  }
  @UseGuards(AuthGuard('jwt'))
  @Post('/send-friend-request')
  async sendFriendRequest(
    @Body('receiverId') receiverId: string,
    @Request() req,
  ) {
    try {
      const senderId = req.user.id;

      await this.userService.sendFriendRequest(senderId, receiverId);
      await this.userGateway.server.emit('friend-request-sent', {
        senderId,
        receiverId,
      });
      return { message: 'Friend request sent successfully' };
    } catch (error) {
      console.log('Error in sendFriendRequest: ', error.message);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/accept-friend-request')
  async acceptFriendRequest(
    @Body('senderId') senderId: string,
    @Request() req,
  ) {
    try {
      const receiverId = req.user.id;
      await this.userService.acceptFriendRequest(senderId, receiverId);
      await this.userGateway.server.emit('accept-friend-request', {
        senderId,
        receiverId,
      });
      return { message: 'Friend request accepted successfully' };
    } catch (error) {
      console.log('Error in acceptFriendRequest: ', error.message);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/get-list-friend-request-pending')
  async getListFriendRequestPending(
    @Query('userId') userId: string,
    @Request() req,
  ) {
    try {
      const receiverId = req.user.id;
      const friendRequests = await this.userService.getListFriendRequestPending(
        userId,
      );
      return friendRequests;
    } catch (error) {
      console.log('Error in getListFriendRequestPending: ', error.message);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/get-friends')
  async getFriends(@Query('userId') userId: string, @Request() req) {
    try {
      // const userId = req.user.id;
      const friends = await this.userService.getFriends(userId);
      return friends;
    } catch (error) {
      console.log('Error in getFriends: ', error.message);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/search-user/:searchValue')
  async searchUser(@Request() req, @Param('searchValue') phone: string) {
    try {
      const users = await this.userService.searchUser(phone);
      if (!users) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'No user found',
        };
      }
      return users;
    } catch (error) {
      console.log('Error in searchUser: ', error.message);
      throw new InternalServerErrorException('Internal server error');
    }
  }
  @Post('updateAvatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatar(@UploadedFile() file, @Body('userId') userId: string) {
    const uploadResult = await new Promise<S3.ManagedUpload.SendData>(
      (resolve, reject) => {
        this.awsUploader.uploadFile(file, (error, data) => {
          if (error) {
            reject(new InternalServerErrorException('Error uploading file.'));
          }
          resolve(data);
        });
      },
    );
    const avatarUrl = uploadResult.Location;
    await this.userService.updateAvatar(userId, avatarUrl);

    return { avatarUrl };
  }

  @Patch('updateProfile')
  async updateProfile(
    @Body('userId') userId: string,
    @Body('username') fullName: string,
    @Body('phone') phone: string,
    @Body('email') email: string,
  ) {
    try {
      const user = await this.userService.updateProfile(
        userId,
        fullName,
        phone,
        email,
      );
      return user;
    } catch (error) {
      console.log('Error in updateProfile: ', error.message);
      throw new InternalServerErrorException('Internal server error');
    }
  }
  @Post('checkExistence')
  async checkExistence(
    @Body('email') email: string,
    @Body('phone') phone: string,
  ) {
    try {
      const userWithEmail = await this.userService.findByEmail(email);
      const userWithPhone = await this.userService.findByPhone(phone);

      if (userWithEmail || userWithPhone) {
        return { exists: true };
      } else {
        return { exists: false };
      }
    } catch (error) {
      console.log('Error in checkExistence: ', error.message);
      throw new InternalServerErrorException('Internal server error');
    }
  }
}
