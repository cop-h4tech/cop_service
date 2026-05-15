import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, ValidateIf } from 'class-validator';

export enum AuthMode {
  OTP = 'otp',
  PASSWORD = 'password',
}

export class LoginDTO {
  @ValidateIf((o) => !o.phone)
  @IsEmail()
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsPhoneNumber()
  phone?: string;

  @IsEnum(AuthMode)
  authMode!: AuthMode;

  @IsOptional()
  @IsString()
  password?: string;
}
