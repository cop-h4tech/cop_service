import {
  IsEmail,
  IsPhoneNumber,
  IsString,
  MinLength,
  IsOptional,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Match } from '../decorators/match.decorator';

export class SignUpDTO {
  @ValidateIf((o) => !o.phone)
  @IsEmail()
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  idProof?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Matches(/^\d{5,6}$/, { message: 'Zip code must be 5-6 digits' })
  zipCode?: string;

  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;

  @ValidateIf((o) => o.password !== undefined)
  @IsString()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword?: string;
}
