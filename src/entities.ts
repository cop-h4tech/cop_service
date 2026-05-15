import { UserEntity } from './modules/auth/entities/user.entity';
import { OtpEntity } from './modules/auth/entities/otp.entity';
import { PaymentInfoEntity } from './modules/auth/entities/payment-info.entity';
import { SessionEntity } from './modules/auth/entities/session.entity';
import { ViolationEntity } from './modules/violations/entities/violation.entity';

export const entities = [
  UserEntity,
  OtpEntity,
  PaymentInfoEntity,
  SessionEntity,
  ViolationEntity,
];
