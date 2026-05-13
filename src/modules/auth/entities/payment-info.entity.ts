import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('payment_info')
export class PaymentInfoEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', nullable: true, name: 'card_number' })
  cardNumber?: string;

  @Column({ type: 'varchar', nullable: true, name: 'card_holder_name' })
  cardHolderName?: string;

  @Column({ type: 'varchar', nullable: true, name: 'expiry_date' })
  expiryDate?: string;

  @Column({ type: 'varchar', nullable: true, name: 'bank_name' })
  bankName?: string;

  @Column({ type: 'varchar', nullable: true, name: 'account_number' })
  accountNumber?: string;

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  isDefault!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
