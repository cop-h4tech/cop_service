import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { PaymentInfoEntity } from '../entities/payment-info.entity';
import { UpdateProfileDTO } from '../dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PaymentInfoEntity)
    private readonly paymentInfoRepository: Repository<PaymentInfoEntity>,
  ) {}

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Account is not active. Please verify your email to activate your account.',
      );
    }

    const paymentInfo = await this.paymentInfoRepository.findOne({
      where: { userId },
    });

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      idProof: user.idProof,
      address: user.address,
      zipCode: user.zipCode,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      paymentInfo,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateProfileDTO: UpdateProfileDTO) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Account is not active. Please verify your email to activate your account.',
      );
    }

    // Update profile fields
    if (updateProfileDTO.phone) {
      user.phone = updateProfileDTO.phone;
    }
    if (updateProfileDTO.firstName) {
      user.firstName = updateProfileDTO.firstName;
    }
    if (updateProfileDTO.lastName) {
      user.lastName = updateProfileDTO.lastName;
    }
    if (updateProfileDTO.idProof) {
      user.idProof = updateProfileDTO.idProof;
    }
    if (updateProfileDTO.address) {
      user.address = updateProfileDTO.address;
    }
    if (updateProfileDTO.zipCode) {
      user.zipCode = updateProfileDTO.zipCode;
    }

    await this.userRepository.save(user);

    const paymentInfo = await this.paymentInfoRepository.findOne({
      where: { userId },
    });

    return {
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        idProof: user.idProof,
        address: user.address,
        zipCode: user.zipCode,
        paymentInfo,
      },
    };
  }

  /**
   * Update payment information
   */
  async updatePaymentInfo(
    userId: string,
    paymentData: Partial<PaymentInfoEntity>,
  ): Promise<{ message: string; paymentInfo: PaymentInfoEntity }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Account is not active. Please verify your email to activate your account.',
      );
    }

    let paymentInfo: PaymentInfoEntity | null =
      await this.paymentInfoRepository.findOne({
        where: { userId },
      });

    if (!paymentInfo) {
      paymentInfo = this.paymentInfoRepository.create({
        userId,
        ...paymentData,
      }) as unknown as PaymentInfoEntity;
    } else {
      Object.assign(paymentInfo, paymentData);
    }

    await this.paymentInfoRepository.save(paymentInfo);

    return {
      message: 'Payment information updated successfully',
      paymentInfo,
    };
  }
}
