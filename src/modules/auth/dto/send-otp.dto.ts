import { IsPhoneNumber } from 'class-validator';

export class SendOTPDTO {
  @IsPhoneNumber()
  phone!: string;
}