import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifySMSOTPDTO {
  @IsPhoneNumber()
  phone!: string;

  @IsString()
  @Length(4, 10)
  code!: string;
}
