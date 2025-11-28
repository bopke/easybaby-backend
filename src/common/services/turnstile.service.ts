import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TurnstileVerificationResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly verificationUrl =
    'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('turnstile.secretKey')!;
  }

  async verifyToken(token: string, remoteIp?: string): Promise<boolean> {
    if (!this.secretKey) {
      this.logger.error('Turnstile secret key not configured');
      throw new Error('Turnstile verification is not configured');
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', this.secretKey);
      formData.append('response', token);
      if (remoteIp) {
        formData.append('remoteip', remoteIp);
      }

      const response = await fetch(this.verificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        this.logger.error(
          `Turnstile API returned ${response.status}: ${response.statusText}`,
        );
        throw new Error('Failed to verify Turnstile token');
      }

      const data: TurnstileVerificationResponse =
        (await response.json()) as TurnstileVerificationResponse;

      if (!data.success) {
        this.logger.warn(
          `Turnstile verification failed for IP ${remoteIp || 'unknown'}: ${JSON.stringify(data['error-codes'])}`,
        );
        return false;
      }

      this.logger.log(
        `Turnstile verification successful for IP ${remoteIp || 'unknown'}`,
      );
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Turnstile verification error: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
