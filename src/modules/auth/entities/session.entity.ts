import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', name: 'user_identifier', default: '' })
  userIdentifier!: string;

  @Column({ type: 'varchar', unique: true, name: 'token' })
  token!: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'expires_at' })
  expiresAt!: Date | null;

  @Column({
    type: 'varchar',
    unique: true,
    name: 'refresh_token',
    default: () => 'uuid_generate_v4()::text',
  })
  refreshToken!: string;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'refresh_token_expires_at',
  })
  refreshTokenExpiresAt!: Date | null;

  @Column({ type: 'boolean', default: false, name: 'is_revoked' })
  isRevoked!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
