import { Expose, Transform } from 'class-transformer';
import { MediaType, ViolationStatus, ViolationType } from '../entities/violation.entity';

export class ViolationResponseDto {
  @Expose()
  id!: string;

  @Expose()
  ticketNumber!: string;

  @Expose()
  userId!: string;

  @Expose()
  mediaType!: MediaType;

  @Expose()
  mediaUrl!: string;

  @Expose()
  vehicleMake!: string;

  @Expose()
  vehicleType!: string;

  @Expose()
  vehicleModel!: string;

  @Expose()
  @Transform(({ value }) => parseFloat(value as string))
  latitude!: number;

  @Expose()
  @Transform(({ value }) => parseFloat(value as string))
  longitude!: number;

  @Expose()
  violationType!: ViolationType;

  @Expose()
  wasMoving!: boolean;

  @Expose()
  status!: ViolationStatus;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
