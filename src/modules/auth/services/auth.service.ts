import { Injectable, BadRequestException, UnauthorizedException, ConflictException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entities/user.entity';
import { SignUpDTO } from '../dto/sign-up.dto';
import { LoginDTO, AuthMode } from '../dto/sign-in.dto';
import { VerifyOTPDTO } from '../dto/verify-otp.dto';
import { ResetPasswordRequestDTO, ResetPasswordDTO } from '../dto/reset-password.dto';
import { ChangePasswordDTO } from '../dto/change-password.dto';
import { OTPService } from './otp.service';
import { EmailService } from './email.service';
import { SessionService } from './session.service';
import { SMSService } from './sms.service';
import { OTPPurpose } from '../entities/otp.entity';
import { maskPhone } from '../utils/mask.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly otpService: OTPService,
    private readonly emailService: EmailService,
    private readonly sessionService: SessionService,
    private readonly smsService: SMSService,
  ) {}

  async signUp(signUpDTO: SignUpDTO): Promise<{ message: string; email: string }> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: signUpDTO.email }, { phone: signUpDTO.phone }],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const user = this.userRepository.create({
      email: signUpDTO.email,
      phone: signUpDTO.phone,
      firstName: signUpDTO.firstName,
      lastName: signUpDTO.lastName,
      idProof: signUpDTO.idProof,
      address: signUpDTO.address,
      zipCode: signUpDTO.zipCode,
      password: signUpDTO.password ?? undefined,
      isActive: false,
    });

    await this.userRepository.save(user);

    const emailOtp = await this.otpService.createOTP(user, OTPPurpose.SIGNUP, signUpDTO.email);
    await this.emailService.sendOTP(signUpDTO.email, emailOtp.code, OTPPurpose.SIGNUP);

    try {
      await this.smsService.sendOTP(signUpDTO.phone);
    } catch (err) {
      this.logger.warn(
        `SMS OTP delivery failed for ${maskPhone(signUpDTO.phone)} — account created, user must request SMS OTP manually. Reason: ${err instanceof Error ? err.message : err}`,
      );
    }

    return {
      message: 'Sign up successful. Please verify your email and phone with the OTPs sent.',
      email: signUpDTO.email,
    };
  }

  async login(loginDTO: LoginDTO): Promise<{ message: string; authMode: AuthMode; token?: string }> {
    const user = await this.userRepository.findOne({ where: { email: loginDTO.email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email address');
    }

    if (!user.isActive) {
      const emailOtp = await this.otpService.createOTP(user, OTPPurpose.SIGNUP, user.email);
      await this.emailService.sendOTP(user.email, emailOtp.code, OTPPurpose.SIGNUP);
      try {
        await this.smsService.sendOTP(user.phone);
      } catch (err) {
        this.logger.warn(
          `SMS OTP resend failed for ${maskPhone(user.phone)} during login attempt. Reason: ${err instanceof Error ? err.message : err}`,
        );
      }
      throw new ForbiddenException(
        'Account is not active. Please verify your email and phone number to activate your account by typing otp send to each.',
      );
    }

    if (loginDTO.authMode === AuthMode.OTP) {
      const emailOtp = await this.otpService.createOTP(user, OTPPurpose.SIGNIN, user.email);
      await this.emailService.sendOTP(user.email, emailOtp.code, OTPPurpose.SIGNIN);

      return { message: 'OTP sent to your registered email', authMode: AuthMode.OTP };
    }

    if (!loginDTO.password) {
      throw new BadRequestException('Password is required for password authentication');
    }

    if (!user.password) {
      throw new BadRequestException('No password set for this account. Please use OTP authentication.');
    }

    const isPasswordValid = await bcrypt.compare(loginDTO.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const session = await this.sessionService.createSession(user.id, user.email);
    return { message: 'Sign in successful', authMode: AuthMode.PASSWORD, token: session.token };
  }

  async verifyLoginOTP(email: string, otp: string): Promise<{ message: string; token: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email address');
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Account is not active. Please verify your email and phone number to activate your account by typing otp send to each.',
      );
    }

    const isOTPValid = await this.otpService.verifyOTP(user, otp, OTPPurpose.SIGNIN);

    if (!isOTPValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const session = await this.sessionService.createSession(user.id, user.email);
    return { message: 'Sign in successful', token: session.token };
  }

  async logout(token: string): Promise<{ message: string }> {
    await this.sessionService.revokeSession(token);
    return { message: 'Logged out successfully' };
  }

  async verifyEmailOTP(verifyOTPDTO: VerifyOTPDTO): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email: verifyOTPDTO.email } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isOTPValid = await this.otpService.verifyOTP(user, verifyOTPDTO.code, OTPPurpose.SIGNUP);

    if (!isOTPValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    user.emailVerified = true;
    if (user.phoneVerified) {
      user.isActive = true;
    }
    await this.userRepository.save(user);

    return {
      message: user.isActive
        ? 'Email verified. You can now sign in.'
        : 'Email verified. Please also verify your phone number.',
    };
  }

  async verifySMSOTP(phone: string, code: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { phone } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isVerified = await this.smsService.verifyOTP(phone, code);

    if (!isVerified) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    user.phoneVerified = true;
    if (user.emailVerified) {
      user.isActive = true;
    }
    await this.userRepository.save(user);

    return {
      message: user.isActive
        ? 'Phone verified. You can now sign in.'
        : 'Phone verified. Please also verify your email address.',
    };
  }

  async sendSMSOTP(phone: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { phone } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.smsService.sendOTP(phone);
    return { message: 'OTP sent to your phone number' };
  }

  async requestPasswordReset(dto: ResetPasswordRequestDTO): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email address');
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Account is not active. Please verify your email and phone number to activate your account by typing otp send to each.',
      );
    }

    const otp = await this.otpService.createOTP(user, OTPPurpose.PASSWORD_RESET, dto.email);
    await this.emailService.sendOTP(dto.email, otp.code, OTPPurpose.PASSWORD_RESET);

    return { message: 'Password reset OTP sent to your registered email' };
  }

  async resetPassword(dto: ResetPasswordDTO): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email address');
    }

    const isOTPValid = await this.otpService.verifyOTP(user, dto.code, OTPPurpose.PASSWORD_RESET);

    if (!isOTPValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);

    return { message: 'Password reset successfully. You can now sign in.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDTO): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new BadRequestException('No password set for this account. Please use OTP authentication.');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);
    await this.sessionService.revokeAllUserSessions(userId);

    return { message: 'Password changed successfully' };
  }
}
