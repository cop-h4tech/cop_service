import { IsEmail } from 'class-validator';

export class ResendEmailOTPDTO {
  @IsEmail()
  email!: string;
}
