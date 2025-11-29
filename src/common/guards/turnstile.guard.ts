import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TurnstileService } from '../services/turnstile.service';

interface RequestWithTurnstile extends Request {
  body: {
    turnstileToken?: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(private readonly turnstileService: TurnstileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithTurnstile>();
    const turnstileToken = request.body?.turnstileToken;

    if (!turnstileToken) {
      throw new UnauthorizedException('Turnstile token is required');
    }

    const clientIp =
      request.ip ||
      (typeof request.headers['x-forwarded-for'] === 'string'
        ? request.headers['x-forwarded-for'].split(',')[0]?.trim()
        : undefined) ||
      request.socket.remoteAddress ||
      'unknown';

    try {
      const isValid = await this.turnstileService.verifyToken(
        turnstileToken,
        clientIp,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid captcha verification');
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Captcha verification failed');
    }
  }
}
