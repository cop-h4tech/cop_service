import { IsString, IsOptional, IsPhoneNumber, Matches } from 'class-validator';

export class UpdateProfileDTO {
  @IsOptional()
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
}
