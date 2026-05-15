import { IsEnum, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export enum AuthMode {
  OTP = 'otp',
  PASSWORD = 'password',
}

export class LoginDTO {
  @IsPhoneNumber()
  phone!: string;

  @IsEnum(AuthMode)
  authMode!: AuthMode;

  @IsOptional()
  @IsString()
  password?: string;
}
