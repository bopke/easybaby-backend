import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  /**
   * Clean up expired refresh tokens
   * Runs daily at 3:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens(): Promise<void> {
    this.logger.log('Starting scheduled cleanup of expired refresh tokens');

    try {
      const count = await this.refreshTokenService.cleanupExpiredTokens();
      this.logger.log(
        `Scheduled cleanup completed. Removed ${count} expired tokens`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to cleanup expired tokens: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
