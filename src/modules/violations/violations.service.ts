import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import { plainToInstance } from 'class-transformer';
import { ViolationEntity } from './entities/violation.entity';
import { SubmitViolationDto } from './dto/submit-violation.dto';
import { ViolationResponseDto } from './dto/violation-response.dto';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class ViolationsService {
  constructor(
    @InjectRepository(ViolationEntity)
    private readonly violationRepository: Repository<ViolationEntity>,
    private readonly s3: S3Service,
  ) {}

  private generateTicketNumber(): string {
    const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const hexSuffix = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
    return `VIO-${datePart}-${hexSuffix}`;
  }

  private async toResponse(entity: ViolationEntity): Promise<ViolationResponseDto> {
    const dto = plainToInstance(ViolationResponseDto, entity, {
      excludeExtraneousValues: true,
    });
    dto.mediaUrl = await this.s3.getSignedUrl(entity.mediaUrl);
    return dto;
  }

  async submit(
    userId: string,
    dto: SubmitViolationDto,
    file: Express.Multer.File,
  ): Promise<ViolationResponseDto> {
    const ext = path.extname(file.originalname);
    const key = `violations/${randomUUID()}${ext}`;

    await this.s3.upload(key, file.buffer, file.mimetype);

    const violation = this.violationRepository.create({
      ticketNumber: this.generateTicketNumber(),
      userId,
      mediaType: dto.mediaType,
      mediaUrl: key,
      vehicleMake: dto.vehicleMake,
      vehicleType: dto.vehicleType,
      vehicleModel: dto.vehicleModel,
      latitude: dto.latitude,
      longitude: dto.longitude,
      violationType: dto.violationType,
      wasMoving: dto.wasMoving,
    });

    const saved = await this.violationRepository.save(violation);
    return this.toResponse(saved);
  }

  async findAllByUser(userId: string): Promise<ViolationResponseDto[]> {
    const violations = await this.violationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(violations.map((v) => this.toResponse(v)));
  }

  async findOneByUser(id: string, userId: string): Promise<ViolationResponseDto> {
    const violation = await this.violationRepository.findOne({
      where: { id, userId },
    });
    if (!violation) {
      throw new NotFoundException(`Violation ${id} not found`);
    }
    return this.toResponse(violation);
  }
}
