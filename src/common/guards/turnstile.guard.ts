import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TurnstileService } from '../services/turnstile.service';

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(private readonly turnstileService: TurnstileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const turnstileToken = request.body?.turnstileToken;

    if (!turnstileToken) {
      throw new UnauthorizedException('Turnstile token is required');
    }

    const clientIp =
      request.ip ||
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.connection.remoteAddress;

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
