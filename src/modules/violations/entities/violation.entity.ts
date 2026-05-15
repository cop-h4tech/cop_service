import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';

export enum MediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
}

export enum MovingViolationType {
  RAN_RED_LIGHT_STOP_SIGN = 'ran_red_light_stop_sign',
  EXPIRED_REGISTRATION_INSPECTION = 'expired_registration_inspection',
  MISSING_ILLEGAL_PLATES = 'missing_illegal_plates',
  FAILURE_TO_SIGNAL = 'failure_to_signal',
  NO_SEATBELT = 'no_seatbelt',
}

export enum ParkingViolationType {
  NO_PARKING_ZONE = 'no_parking_zone',
  BUS_STOP = 'bus_stop',
  LOADING_ZONE = 'loading_zone',
  SIDEWALK = 'sidewalk',
  DISABLED_WITHOUT_PLACARD = 'disabled_without_placard',
  DOUBLE_PARKED = 'double_parked',
  BLOCKING_DRIVEWAY = 'blocking_driveway',
  BLOCKING_CROSSWALK = 'blocking_crosswalk',
  BLOCKING_FIRE_HYDRANT = 'blocking_fire_hydrant',
  BLOCKING_TRAFFIC = 'blocking_traffic',
  NOT_WITHIN_MARKED_SPACE = 'not_within_marked_space',
  EXPIRED_METER = 'expired_meter',
}

// Combined enum for DB column definition and validation
export const ViolationType = { ...MovingViolationType, ...ParkingViolationType } as const;
export type ViolationType = MovingViolationType | ParkingViolationType;

export enum ViolationStatus {
  PENDING = 'pending',
  PAID = 'paid',
  DISMISSED = 'dismissed',
}

@Entity('violations')
export class ViolationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true, name: 'ticket_number' })
  ticketNumber!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'enum', enum: MediaType, name: 'media_type' })
  mediaType!: MediaType;

  @Column({ type: 'jsonb', name: 'media_urls' })
  mediaUrls!: string[];

  @Column({ type: 'varchar', name: 'vehicle_make' })
  vehicleMake!: string;

  @Column({ type: 'varchar', name: 'vehicle_type' })
  vehicleType!: string;

  @Column({ type: 'varchar', name: 'vehicle_model' })
  vehicleModel!: string;

  @Column({ type: 'varchar', name: 'license_plate' })
  licensePlate!: string;

  @Column({ type: 'varchar', name: 'vehicle_color', nullable: true })
  vehicleColor?: string;

  @Column({ type: 'varchar', name: 'detected_plate', nullable: true })
  detectedPlate?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, name: 'latitude' })
  latitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, name: 'longitude' })
  longitude!: number;

  @Column({ type: 'enum', enum: ViolationType, name: 'violation_type' })
  violationType!: ViolationType;

  @Column({ type: 'boolean', nullable: true, name: 'was_moving' })
  wasMoving?: boolean | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'violation_timestamp' })
  violationTimestamp?: Date;

  @Column({
    type: 'enum',
    enum: ViolationStatus,
    default: ViolationStatus.PENDING,
    name: 'status',
  })
  status!: ViolationStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
