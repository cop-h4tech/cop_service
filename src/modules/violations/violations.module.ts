import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViolationEntity } from './entities/violation.entity';
import { ViolationsController } from './violations.controller';
import { ViolationsService } from './violations.service';
import { AuthModule } from '../auth/auth.module';
import { UserEntity } from '../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ViolationEntity, UserEntity]), AuthModule],
  controllers: [ViolationsController],
  providers: [ViolationsService],
})
export class ViolationsModule {}
