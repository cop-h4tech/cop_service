import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('payment_info')
export class PaymentInfoEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'varchar', nullable: true })
  cardNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  cardHolderName?: string;

  @Column({ type: 'varchar', nullable: true })
  expiryDate?: string;

  @Column({ type: 'varchar', nullable: true })
  bankName?: string;

  @Column({ type: 'varchar', nullable: true })
  accountNumber?: string;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
