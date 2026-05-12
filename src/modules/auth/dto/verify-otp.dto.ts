import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOTPDTO {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
