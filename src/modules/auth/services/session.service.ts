import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { SessionEntity } from '../entities/session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  async createSession(userId: string, email: string): Promise<SessionEntity> {
    const ttlDays = Number.parseInt(process.env.SESSION_TTL_DAYS ?? '30', 10);
    const expiresAt = ttlDays === 0 ? null : new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    const jwtOptions = ttlDays === 0 ? {} : { expiresIn: ttlDays * 24 * 60 * 60 };
    const token = sign(
      { userId, email },
      process.env.JWT_SECRET ?? 'change-me-in-production',
      jwtOptions,
    );
    const session = this.sessionRepository.create({ userId, token, expiresAt });
    return this.sessionRepository.save(session);
  }

  async validateSession(token: string): Promise<void> {
    const session = await this.sessionRepository.findOne({ where: { token } });
    if (!session || session.isRevoked || (session.expiresAt !== null && session.expiresAt < new Date())) {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }

  async revokeSession(token: string): Promise<void> {
    const session = await this.sessionRepository.findOne({ where: { token } });
    if (!session || session.isRevoked) {
      throw new UnauthorizedException('Invalid or already revoked session');
    }
    session.isRevoked = true;
    await this.sessionRepository.save(session);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.sessionRepository.update({ userId, isRevoked: false }, { isRevoked: true });
  }
}
