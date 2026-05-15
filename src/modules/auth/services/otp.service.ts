import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { OtpEntity, OTPPurpose } from '../entities/otp.entity';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class OTPService {
  constructor(
    @InjectRepository(OtpEntity)
    private readonly otpRepository: Repository<OtpEntity>,
  ) { }

  /**
   * Generate a random 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create and save OTP for user
   */
  async createOTP(
    user: UserEntity,
    purpose: OTPPurpose,
    sentTo: string,
  ): Promise<OtpEntity> {
    // Invalidate previous OTPs for this purpose
    await this.otpRepository.update(
      { userId: user.id, purpose, isVerified: false },
      { isVerified: true }, // Mark old ones as verified to exclude them
    );

    const code = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otp = this.otpRepository.create({
      userId: user.id,
      code,
      purpose,
      sentTo,
      expiresAt,
    });

    return this.otpRepository.save(otp);
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(
    user: UserEntity,
    code: string,
    purpose: OTPPurpose,
  ): Promise<boolean> {
    const now = new Date();
    const otp = await this.otpRepository.findOne({
      where: {
        userId: user.id,
        code,
        purpose,
        isVerified: false,
        expiresAt: MoreThan(now),
      },
    });

    if (!otp) {
      return false;
    }

    otp.isVerified = true;
    await this.otpRepository.save(otp);
    return true;
  }

  /**
   * Get latest OTP for user
   */
  async getLatestOTP(
    userId: string,
    purpose: OTPPurpose,
  ): Promise<OtpEntity | null> {
    return this.otpRepository.findOne({
      where: { userId, purpose, isVerified: false },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Clean up expired OTPs
   */
  async cleanupExpiredOTPs(): Promise<void> {
    await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
