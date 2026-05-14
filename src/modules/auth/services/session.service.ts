import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { SessionEntity } from '../entities/session.entity';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  async createSession(userId: string, userIdentifier: string): Promise<TokenPair> {
    const { accessToken, expiresAt, expiresIn } = this.buildAccessToken(userId, userIdentifier);
    const { refreshToken, refreshTokenExpiresAt } = this.buildRefreshToken();

    const session = this.sessionRepository.create({
      userId,
      userIdentifier,
      token: accessToken,
      expiresAt,
      refreshToken,
      refreshTokenExpiresAt,
    });

    await this.sessionRepository.save(session);
    return { accessToken, refreshToken, expiresIn };
  }

  async refreshSession(refreshToken: string): Promise<TokenPair> {
    const session = await this.sessionRepository.findOne({ where: { refreshToken } });

    if (!session || session.isRevoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.refreshTokenExpiresAt && session.refreshTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired, please sign in again');
    }

    const { accessToken, expiresAt, expiresIn } = this.buildAccessToken(session.userId, session.userIdentifier);
    const { refreshToken: newRefreshToken, refreshTokenExpiresAt } = this.buildRefreshToken();

    session.token = accessToken;
    session.expiresAt = expiresAt;
    session.refreshToken = newRefreshToken;
    session.refreshTokenExpiresAt = refreshTokenExpiresAt;

    await this.sessionRepository.save(session);
    return { accessToken, refreshToken: newRefreshToken, expiresIn };
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

  private buildAccessToken(userId: string, userIdentifier: string): { accessToken: string; expiresAt: Date; expiresIn: number } {
    const expiresIn = Number.parseInt(process.env.ACCESS_TOKEN_TTL_SECONDS ?? '900', 10);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const accessToken = sign(
      { userId, email: userIdentifier },
      process.env.JWT_SECRET ?? 'change-me-in-production',
      { expiresIn },
    );
    return { accessToken, expiresAt, expiresIn };
  }

  private buildRefreshToken(): { refreshToken: string; refreshTokenExpiresAt: Date } {
    const ttlDays = Number.parseInt(process.env.REFRESH_TOKEN_TTL_DAYS ?? '90', 10);
    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenExpiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    return { refreshToken, refreshTokenExpiresAt };
  }
}
