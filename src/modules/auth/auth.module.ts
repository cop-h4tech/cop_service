import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './services/auth.service';
import { OTPService } from './services/otp.service';
import { UserService } from './services/user.service';
import { SessionService } from './services/session.service';
import { InvitationService } from './services/invitation.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { AdminController } from './admin.controller';
import { UserEntity } from './entities/user.entity';
import { OtpEntity } from './entities/otp.entity';
import { PaymentInfoEntity } from './entities/payment-info.entity';
import { SessionEntity } from './entities/session.entity';
import { InvitationTokenEntity } from './entities/invitation-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      OtpEntity,
      PaymentInfoEntity,
      SessionEntity,
      InvitationTokenEntity,
    ]),
  ],
  controllers: [AuthController, UserController, AdminController],
  providers: [
    AuthService,
    OTPService,
    UserService,
    SessionService,
    InvitationService,
    AuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, UserService, AuthGuard, RolesGuard, SessionService],
})
export class AuthModule {}
