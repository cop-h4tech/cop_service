import { Injectable, BadRequestException, UnauthorizedException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
// Restore when Twilio SMS is configured: import { SmsService } from './sms.service';
import { OTPPurpose } from '../entities/otp.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly otpService: OTPService,
    private readonly emailService: EmailService,
    private readonly sessionService: SessionService,
    // TODO: inject when Twilio SMS is configured: private readonly smsService: SmsService,
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
    // TODO: create phone OTP and send via Twilio when SMS is configured
    // const phoneOtp = await this.otpService.createOTP(user, OTPPurpose.SIGNUP, signUpDTO.phone);
    // await this.smsService.sendOTP(signUpDTO.phone, phoneOtp.code, OTPPurpose.SIGNUP);

    return {
      message: 'Sign up successful. Please verify your email with the OTP sent.',
      email: signUpDTO.email,
    };
  }

  async login(loginDTO: LoginDTO): Promise<{ message: string; authMode: AuthMode; token?: string }> {
    const user = await this.userRepository.findOne({ where: { email: loginDTO.email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email address');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is not active. Please verify your email to activate your account.');
    }

    if (loginDTO.authMode === AuthMode.OTP) {
      const emailOtp = await this.otpService.createOTP(user, OTPPurpose.SIGNIN, user.email);
      await this.emailService.sendOTP(user.email, emailOtp.code, OTPPurpose.SIGNIN);
      // TODO: send SMS OTP via Twilio when configured
      // await this.smsService.sendOTP(user.phone, phoneOtp.code, OTPPurpose.SIGNIN);

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
      throw new ForbiddenException('Account is not active. Please verify your email to activate your account.');
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
    user.isActive = true;
    // Set isActive = true only after phoneVerified as well, once Twilio SMS is configured
    await this.userRepository.save(user);

    return { message: 'Email verified successfully. You can now sign in.' };
  }

  async requestPasswordReset(dto: ResetPasswordRequestDTO): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email address');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is not active. Please verify your email to activate your account.');
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
