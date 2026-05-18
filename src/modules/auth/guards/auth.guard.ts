import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { Request } from 'express';
import { SessionService } from '../services/session.service';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.slice(7);

    try {
      const payload = verify(
        token,
        process.env.JWT_SECRET ?? 'change-me-in-production',
      ) as { userId: string; email: string; role: UserRole };

      await this.sessionService.validateSession(token);
      (request as Request & Record<string, unknown>)['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired session token');
    }
  }
}
