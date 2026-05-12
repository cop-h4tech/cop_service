import { DataSource } from 'typeorm';
import { UserEntity } from './modules/auth/entities/user.entity';
import { OtpEntity } from './modules/auth/entities/otp.entity';
import { PaymentInfoEntity } from './modules/auth/entities/payment-info.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT as string),
  username: process.env.DB_USERNAME!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  entities: [UserEntity, OtpEntity, PaymentInfoEntity],
  migrations: [
    process.env.NODE_ENV === 'production'
      ? 'dist/migrations/*.js'
      : 'src/migrations/*.ts',
  ],
  migrationsTableName: 'migrations',
});
