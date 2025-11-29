import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource, QueryFailedError } from 'typeorm';
import {
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
} from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';
import { Paginated, Pagination } from '../../common/pagination';
import { PaginationService } from '../../common/services/pagination.service';

export interface RefreshTokenPayload {
  sub: string; // user ID
  jti: string; // JWT ID
  type: 'refresh';
  family: string; // token family for rotation tracking
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Generate a new refresh token for a user
   */
  async generateRefreshToken(
    user: User,
    ipAddress?: string,
    userAgent?: string,
    tokenFamily?: string,
  ): Promise<{ token: string; expiresIn: number }> {
    const jti = uuidv4();
    const family = tokenFamily || uuidv4();
    const expiresIn = this.getRefreshTokenExpiration();

    const payload: RefreshTokenPayload = {
      sub: user.id,
      jti,
      type: 'refresh',
      family,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('refreshToken.secret'),
      expiresIn: `${expiresIn}s`,
    });

    const refreshToken = this.refreshTokenRepository.create({
      jti,
      userId: user.id,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      tokenFamily: family,
      isRevoked: false,
    });

    await this.refreshTokenRepository.save(refreshToken);

    this.logger.log(
      `Refresh token generated for user ${user.id} with JTI ${jti}`,
    );

    return { token, expiresIn };
  }

  /**
   * Validate refresh token and return user ID
   * Throws UnauthorizedException if token is invalid or revoked
   */
  async validateRefreshToken(
    token: string,

    ipAddress?: string,
    userAgent?: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(token, {
        secret: this.configService.get<string>('refreshToken.secret'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const tokenRecord = await this.refreshTokenRepository.findOne({
        where: { jti: payload.jti },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Token not found');
      }

      if (tokenRecord.isRevoked) {
        // Token reuse detected - revoke entire family
        this.logger.warn(
          `Revoked token reuse detected! Revoking entire family ${payload.family}`,
        );

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          await queryRunner.manager.update(
            RefreshToken,
            { tokenFamily: payload.family, isRevoked: false },
            { isRevoked: true },
          );
          await queryRunner.commitTransaction();
          this.logger.warn(
            `All tokens in family ${payload.family} have been revoked`,
          );
        } catch (error) {
          await queryRunner.rollbackTransaction();
          this.logger.error(
            `Failed to revoke token family ${payload.family}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        } finally {
          await queryRunner.release();
        }

        throw new UnauthorizedException(
          'Token has been revoked. All tokens in this family have been revoked for security.',
        );
      }

      if (tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      // Validate user agent matches (detects token theft to different device)
      if (userAgent && tokenRecord.userAgent) {
        if (tokenRecord.userAgent !== userAgent) {
          this.logger.warn(
            `User agent mismatch for token ${payload.jti}: ` +
              `stored="${tokenRecord.userAgent}", received="${userAgent}"`,
          );

          // Revoke this specific token (not entire family - user may have multiple devices)
          await this.revokeTokenByJti(payload.jti);

          throw new UnauthorizedException(
            'Your session is no longer valid. Please log in again.',
          );
        }
      }

      // Update last used timestamp
      tokenRecord.lastUsedAt = new Date();
      await this.refreshTokenRepository.save(tokenRecord);

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error instanceof TokenExpiredError) {
        this.logger.log('Token verification failed: Token has expired');
        throw new UnauthorizedException('Refresh token has expired');
      }

      if (
        error instanceof JsonWebTokenError ||
        error instanceof NotBeforeError
      ) {
        this.logger.warn(
          `Token verification failed: ${error.message}`,
          error.stack,
        );
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (error instanceof QueryFailedError) {
        this.logger.error(
          `Database error during token validation: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          'Token validation failed due to server error',
        );
      }

      // Log and re-throw unexpected errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Unexpected error during token validation: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Rotate refresh token - issue new one and revoke old one
   */
  async rotateRefreshToken(
    oldToken: string,
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ token: string; expiresIn: number }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate old token
      const payload = await this.validateRefreshToken(
        oldToken,
        ipAddress,
        userAgent,
      );

      // Revoke old token (update within transaction)
      await queryRunner.manager.update(
        RefreshToken,
        { jti: payload.jti },
        { isRevoked: true },
      );
      this.logger.log(`Refresh token ${payload.jti} revoked`);

      // Generate new token data
      const jti = uuidv4();
      const expiresIn = this.getRefreshTokenExpiration();

      const newPayload: RefreshTokenPayload = {
        sub: user.id,
        jti,
        type: 'refresh',
        family: payload.family,
      };

      const token = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('refreshToken.secret'),
        expiresIn: `${expiresIn}s`,
      });

      // Create new token record (insert within transaction)
      const refreshToken = queryRunner.manager.create(RefreshToken, {
        jti,
        userId: user.id,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        tokenFamily: payload.family,
        isRevoked: false,
      });

      await queryRunner.manager.save(refreshToken);

      // Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log(
        `Refresh token generated for user ${user.id} with JTI ${jti}`,
      );

      return { token, expiresIn };
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Token rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  /**
   * Revoke a refresh token by JTI
   */
  async revokeTokenByJti(jti: string): Promise<void> {
    const token = await this.refreshTokenRepository.findOne({
      where: { jti },
    });

    if (token) {
      token.isRevoked = true;
      await this.refreshTokenRepository.save(token);
      this.logger.log(`Refresh token ${jti} revoked`);
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    this.logger.log(`All refresh tokens revoked for user ${userId}`);
  }

  /**
   * Revoke all tokens in a token family (for reuse detection)
   */
  async revokeTokenFamily(family: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { tokenFamily: family, isRevoked: false },
      { isRevoked: true },
    );

    this.logger.warn(`All tokens in family ${family} have been revoked`);
  }

  /**
   * Get all active sessions for a user with pagination, filtering, and ordering
   */
  async getUserSessions(
    userId: string,
    pagination: Pagination = { page: 1, limit: 10 },
    filters: {
      ipAddress?: string;
      userAgent?: string;
      tokenFamily?: string;
    } = {},
    ordering: { order?: string[] } = {},
  ): Promise<Paginated<RefreshToken>> {
    const { page, limit } = pagination;

    const stringFields: (keyof RefreshToken)[] = ['ipAddress', 'userAgent'];

    const where = this.paginationService.buildWhereClause<RefreshToken>(
      filters as Record<string, unknown>,
      stringFields,
      { userId, isRevoked: false },
    );
    const order = this.paginationService.buildOrderClause<RefreshToken>(
      ordering.order,
      { createdAt: 'DESC' },
      RefreshToken,
    );

    const [sessions, total] = await this.refreshTokenRepository.findAndCount({
      where,
      order,
      skip: this.paginationService.calculateSkip(page, limit),
      take: limit,
    });

    return { data: sessions, total, page, limit };
  }

  /**
   * Check if user has reached maximum session limit
   */
  async hasReachedSessionLimit(userId: string): Promise<boolean> {
    const maxSessions =
      this.configService.get<number>('refreshToken.maxSessions') || 5;
    const result = await this.getUserSessions(userId);
    return result.total >= maxSessions;
  }

  /**
   * Clean up expired tokens (for scheduled job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    const count = result.affected || 0;
    if (count > 0) {
      this.logger.log(`Cleaned up ${count} expired refresh tokens`);
    }

    return count;
  }

  /**
   * Get refresh token expiration in seconds
   */
  private getRefreshTokenExpiration(): number {
    return this.configService.get<number>('refreshToken.expiration') || 2592000;
  }
}
