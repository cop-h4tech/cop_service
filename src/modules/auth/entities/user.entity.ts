import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true, nullable: true, name: 'email' })
  email?: string;

  @Column({ type: 'varchar', unique: true, nullable: true, name: 'phone' })
  phone?: string;

  @Column({ type: 'varchar', nullable: true, name: 'first_name' })
  firstName?: string;

  @Column({ type: 'varchar', nullable: true, name: 'last_name' })
  lastName?: string;

  @Column({ type: 'varchar', nullable: true, name: 'id_proof' })
  idProof?: string;

  @Column({ type: 'text', nullable: true, name: 'address' })
  address?: string;

  @Column({ type: 'varchar', nullable: true, name: 'zip_code' })
  zipCode?: string;

  @Column({ type: 'varchar', nullable: true, name: 'password' })
  password?: string;

  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  emailVerified!: boolean;

  @Column({ type: 'boolean', default: false, name: 'phone_verified' })
  phoneVerified!: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    name: 'role',
  })
  role!: UserRole;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}
