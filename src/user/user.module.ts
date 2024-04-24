import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { AuthModule } from 'src/auth/auth.module';
import { Friend } from './entities/friend.entity';
import { UserGateway } from './user.gateway';
import { AWSUploader } from 'src/chat/fileUploader.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Friend]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService, UserGateway,AWSUploader],
  exports: [UserService],
})
export class UserModule {}
