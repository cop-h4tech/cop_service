import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { InvitationTokenEntity } from '../entities/invitation-token.entity';
import { UserEntity } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
import { EmailService } from '../../notifications/email.service';

const INVITATION_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    @InjectRepository(InvitationTokenEntity)
    private readonly invitationRepo: Repository<InvitationTokenEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async createInvitation(email: string): Promise<{ message: string }> {
    const existingUser = await this.userRepo.findOne({ where: { email } });

    if (existingUser) {
      existingUser.role = UserRole.OFFICER;
      await this.userRepo.save(existingUser);
      await this.emailService.sendOfficerRoleUpdate(email);
      this.logger.log(`Existing user ${email} promoted to officer`);
      return { message: `User role updated to officer and notified via email` };
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
    await this.invitationRepo.save(
      this.invitationRepo.create({ token, email, expiresAt }),
    );

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? '';
    const invitationLink = frontendUrl
      ? `${frontendUrl}/join?token=${token}`
      : token;

    await this.emailService.sendOfficerInvitation(email, invitationLink);
    this.logger.log(`Officer invitation sent to ${email}`);

    return { message: `Invitation sent to ${email}` };
  }

  async useInvitation(token: string, email: string): Promise<UserRole> {
    const invitation = await this.invitationRepo.findOne({ where: { token } });

    if (!invitation) {
      throw new BadRequestException('Invalid invitation token');
    }
    if (invitation.usedAt) {
      throw new BadRequestException('Invitation token has already been used');
    }
    if (invitation.email !== email) {
      throw new BadRequestException(
        'Invitation token does not match the provided email',
      );
    }
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation token has expired');
    }

    invitation.usedAt = new Date();
    await this.invitationRepo.save(invitation);

    return UserRole.OFFICER;
  }
}
