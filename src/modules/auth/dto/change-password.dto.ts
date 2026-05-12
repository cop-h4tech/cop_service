import { IsString, MinLength } from 'class-validator';
import { Match } from '../decorators/match.decorator';

export class ChangePasswordDTO {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword!: string;

  @IsString()
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmNewPassword!: string;
}
