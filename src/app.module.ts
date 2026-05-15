import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ViolationsModule } from './modules/violations/violations.module';
import { S3Module } from './modules/s3/s3.module';
import { entities } from './entities';

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
      entities,
      synchronize: false,
      logging: false,
      extra: {
        options: `-c timezone=${process.env.DB_TIMEZONE ?? 'UTC'}`,
      },
    }),
    S3Module,
    HealthModule,
    AuthModule,
    ViolationsModule,
  ],
})
export class AppModule {}

