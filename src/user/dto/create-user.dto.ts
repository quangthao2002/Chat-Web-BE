import { IsBoolean, IsInt, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  readonly username: string;

  @IsString()
  readonly password: string;

  @IsString()
  readonly phone: string;

  @IsString()
  readonly email: string;

  @IsString()
  readonly fullName: string;

  @IsString()
  readonly avatar: string;

  @IsBoolean()
  readonly is_verify: boolean;

  @IsBoolean()
  readonly is_admin: boolean;
}
