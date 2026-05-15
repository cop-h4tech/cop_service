import { IsPhoneNumber } from 'class-validator';

export class SendSMSOTPDTO {
  @IsPhoneNumber()
  phone!: string;
}
