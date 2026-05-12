import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export enum AuthMode {
  OTP = 'otp',
  PASSWORD = 'password',
}

export class LoginDTO {
  @IsEmail()
  email!: string;

  @IsEnum(AuthMode)
  authMode!: AuthMode;

  @IsOptional()
  @IsString()
  password?: string;
}
