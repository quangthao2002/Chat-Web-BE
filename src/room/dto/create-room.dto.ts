import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  readonly name: string;

  @IsString()
  readonly avatar: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsArray()
  member?: string[];
}
