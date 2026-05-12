import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { Match } from '../decorators/match.decorator';

export class ResetPasswordRequestDTO {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDTO {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword!: string;

  @IsString()
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmNewPassword!: string;
}
