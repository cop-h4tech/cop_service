import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import { sign } from 'jsonwebtoken';
import { plainToInstance } from 'class-transformer';
import { MediaType, ViolationEntity } from './entities/violation.entity';
import { SubmitViolationDto } from './dto/submit-violation.dto';
import { ViolationResponseDto } from './dto/violation-response.dto';
import { S3Service } from '../s3/s3.service';
import { UserEntity } from '../auth/entities/user.entity';
import { EmailService } from '../auth/services/email.service';
import { SMSService } from '../auth/services/sms.service';
import { PHOTO_MIMES } from './violations.constants';

function utcCompact(): string {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z');
}

@Injectable()
export class ViolationsService {
  private readonly logger = new Logger(ViolationsService.name);

  constructor(
    @InjectRepository(ViolationEntity)
    private readonly violationRepository: Repository<ViolationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly s3: S3Service,
    private readonly emailService: EmailService,
    private readonly smsService: SMSService,
    private readonly configService: ConfigService,
  ) {}

  private generateTicketNumber(): string {
    const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const hexSuffix = randomUUID()
      .replaceAll('-', '')
      .slice(0, 8)
      .toUpperCase();
    return `VIO-${datePart}-${hexSuffix}`;
  }

  private async toResponse(
    entity: ViolationEntity,
  ): Promise<ViolationResponseDto> {
    const dto = plainToInstance(ViolationResponseDto, entity, {
      excludeExtraneousValues: true,
    });
    dto.mediaUrls = await Promise.all(
      entity.mediaUrls.map((key) => this.s3.getSignedUrl(key)),
    );
    return dto;
  }

  async submit(
    userId: string,
    dto: SubmitViolationDto,
    files: Express.Multer.File[],
  ): Promise<ViolationResponseDto> {
    const mediaType = PHOTO_MIMES.has(files[0].mimetype)
      ? MediaType.PHOTO
      : MediaType.VIDEO;

    const user = await this.userRepository.findOne({ where: { id: userId } });

    const pathToken = sign(
      { userId, email: user?.email ?? null, phone: user?.phone ?? null },
      this.configService.get<string>('JWT_SECRET')!,
    );

    const timestamp = utcCompact();

    const mediaUrls = await Promise.all(
      files.map(async (file) => {
        const folder = PHOTO_MIMES.has(file.mimetype) ? 'images' : 'video';
        const ext = path.extname(file.originalname);
        const key = `violations/${pathToken}-${timestamp}/${folder}/${randomUUID()}${ext}`;
        await this.s3.upload(key, file.buffer, file.mimetype);
        return key;
      }),
    );

    const violation = this.violationRepository.create({
      ticketNumber: this.generateTicketNumber(),
      userId,
      mediaType,
      mediaUrls,
      vehicleMake: dto.vehicleMake,
      vehicleType: dto.vehicleType,
      vehicleModel: dto.vehicleModel,
      licensePlate: dto.licensePlate,
      vehicleColor: dto.vehicleColor,
      latitude: dto.latitude,
      longitude: dto.longitude,
      violationType: dto.violationType,
      wasMoving: dto.wasMoving ?? null,
      violationTimestamp: dto.violationTimestamp
        ? new Date(dto.violationTimestamp)
        : undefined,
    });

    const saved = await this.violationRepository.save(violation);

    if (user) {
      this.sendSubmissionNotifications(user, saved.ticketNumber).catch(
        (err: unknown) =>
          this.logger.error('Violation notification failed', err),
      );
    }

    return this.toResponse(saved);
  }

  async findAllByUser(userId: string): Promise<ViolationResponseDto[]> {
    const violations = await this.violationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(violations.map((v) => this.toResponse(v)));
  }

  private async sendSubmissionNotifications(
    user: UserEntity,
    ticketNumber: string,
  ): Promise<void> {
    const message =
      `Your violation has been submitted (Ticket: ${ticketNumber}). ` +
      `Thank you for your public engagement! If the violation is paid you will receive 25% of the ticket payment.`;

    if (user.email) {
      await this.emailService.sendViolationConfirmation(
        user.email,
        ticketNumber,
      );
    }
    if (user.phone) {
      await this.smsService.sendMessage(user.phone, message);
    }
  }

  async findOneByUser(
    id: string,
    userId: string,
  ): Promise<ViolationResponseDto> {
    const violation = await this.violationRepository.findOne({
      where: { id, userId },
    });
    if (!violation) {
      throw new NotFoundException(`Violation ${id} not found`);
    }
    return this.toResponse(violation);
  }
}
