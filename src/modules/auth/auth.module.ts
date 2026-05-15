import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './services/auth.service';
import { OTPService } from './services/otp.service';
import { UserService } from './services/user.service';
import { EmailService } from './services/email.service';
import { SMSService } from './services/sms.service';
import { SessionService } from './services/session.service';
import { AuthGuard } from './guards/auth.guard';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { UserEntity } from './entities/user.entity';
import { OtpEntity } from './entities/otp.entity';
import { PaymentInfoEntity } from './entities/payment-info.entity';
import { SessionEntity } from './entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      OtpEntity,
      PaymentInfoEntity,
      SessionEntity,
    ]),
  ],
  controllers: [AuthController, UserController],
  providers: [
    AuthService,
    OTPService,
    UserService,
    EmailService,
    SMSService,
    SessionService,
    AuthGuard,
  ],
  exports: [
    AuthService,
    UserService,
    AuthGuard,
    SessionService,
    EmailService,
    SMSService,
  ],
})
export class AuthModule {}
