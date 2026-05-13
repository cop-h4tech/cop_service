import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserEntity } from './modules/auth/entities/user.entity';
import { OtpEntity } from './modules/auth/entities/otp.entity';
import { PaymentInfoEntity } from './modules/auth/entities/payment-info.entity';
import { SessionEntity } from './modules/auth/entities/session.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT ?? '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [UserEntity, OtpEntity, PaymentInfoEntity, SessionEntity],
      synchronize: false,
      logging: false,
      extra: {
        options: `-c timezone=${process.env.DB_TIMEZONE ?? 'UTC'}`,
      },
    }),
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}

