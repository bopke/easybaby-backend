import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  LessThan,
  ILike,
  FindOptionsWhere,
  FindOptionsOrder,
} from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';
import { Paginated, Pagination } from '../../common/pagination';

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        await this.revokeTokenFamily(payload.family);
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
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Token validation failed: ${message}`);
      throw new UnauthorizedException('Invalid refresh token');
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
    const payload = await this.validateRefreshToken(
      oldToken,
      ipAddress,
      userAgent,
    );

    await this.revokeTokenByJti(payload.jti);

    return this.generateRefreshToken(
      user,
      ipAddress,
      userAgent,
      payload.family,
    );
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
    const where = this.buildWhereClauseForSessions(userId, filters);
    const order = this.buildOrderClauseForSessions(ordering);

    const [sessions, total] = await this.refreshTokenRepository.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data: sessions, total, page, limit };
  }

  private buildWhereClauseForSessions(
    userId: string,
    filters: {
      ipAddress?: string;
      userAgent?: string;
      tokenFamily?: string;
    },
  ): FindOptionsWhere<RefreshToken> {
    const where: FindOptionsWhere<RefreshToken> = {
      userId,
      isRevoked: false,
    };

    // String filters - use ILike for case-insensitive partial matching
    if (filters.ipAddress) {
      where.ipAddress = ILike(`%${filters.ipAddress}%`);
    }
    if (filters.userAgent) {
      where.userAgent = ILike(`%${filters.userAgent}%`);
    }
    if (filters.tokenFamily) {
      where.tokenFamily = filters.tokenFamily;
    }

    return where;
  }

  private buildOrderClauseForSessions(ordering: {
    order?: string[];
  }): FindOptionsOrder<RefreshToken> {
    const order: FindOptionsOrder<RefreshToken> = {};

    if (ordering.order && ordering.order.length > 0) {
      for (const orderStr of ordering.order) {
        const [field, direction] = orderStr.split(':');
        order[field as keyof RefreshToken] = direction.toUpperCase() as
          | 'ASC'
          | 'DESC';
      }
    } else {
      // Default order by createdAt descending
      order.createdAt = 'DESC';
    }

    return order;
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
   * Get refresh token expiration in seconds (30 days)
   */
  private getRefreshTokenExpiration(): number {
    return 30 * 24 * 60 * 60; // 30 days
  }
}
