import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateMessageDto {
  @IsUUID()
   id: string;  

  @IsOptional()
  @IsString()
  text: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsUUID()
  recipientId: string;

  @IsOptional()
  fileData: ArrayBuffer;
}
