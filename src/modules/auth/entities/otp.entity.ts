import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

export enum OTPPurpose {
  SIGNUP = 'signup',
  SIGNIN = 'signin',
  PROFILE_UPDATE = 'profile_update',
  PASSWORD_RESET = 'password_reset',
}

@Entity('otps')
export class OtpEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 6, name: 'code' })
  code!: string;

  @Column({ type: 'enum', enum: OTPPurpose, name: 'purpose' })
  purpose!: OTPPurpose;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified!: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'sent_to' })
  sentTo?: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;
}
