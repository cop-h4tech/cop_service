import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MediaType, ViolationType } from '../entities/violation.entity';

export class SubmitViolationDto {
  @IsEnum(MediaType)
  mediaType!: MediaType;

  @IsString()
  vehicleMake!: string;

  @IsString()
  vehicleType!: string;

  @IsString()
  vehicleModel!: string;

  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsEnum(ViolationType)
  violationType!: ViolationType;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  wasMoving!: boolean;
}
