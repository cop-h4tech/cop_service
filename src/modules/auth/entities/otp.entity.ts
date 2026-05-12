import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
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

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 6 })
  code!: string;

  @Column({ type: 'enum', enum: OTPPurpose })
  purpose!: OTPPurpose;

  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  sentTo?: string; // email or phone

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;
}
