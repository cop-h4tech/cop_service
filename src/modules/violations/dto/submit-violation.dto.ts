import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ViolationType } from '../entities/violation.entity';

export class SubmitViolationDto {
  @Transform(({ value }) => (value == null ? value : String(value)))
  @IsString()
  vehicleMake!: string;

  @Transform(({ value }) => (value == null ? value : String(value)))
  @IsString()
  vehicleType!: string;

  @Transform(({ value }) => (value == null ? value : String(value)))
  @IsString()
  vehicleModel!: string;

  @Transform(({ value }) => (value == null ? value : String(value)))
  @IsString()
  licensePlate!: string;

  @IsOptional()
  @Transform(({ value }) => (value == null ? value : String(value)))
  @IsString()
  vehicleColor?: string;

  @Transform(({ value }) => Number.parseFloat(value as string))
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Transform(({ value }) => Number.parseFloat(value as string))
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsDateString()
  violationTimestamp?: string;

  @IsEnum(ViolationType)
  violationType!: ViolationType;

  @ValidateIf(
    (o: SubmitViolationDto) => o.violationType === ViolationType.NO_SEATBELT,
  )
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  wasMoving?: boolean;
}
