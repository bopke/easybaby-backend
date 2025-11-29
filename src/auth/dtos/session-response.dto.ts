import { ApiProperty } from '@nestjs/swagger';
import { RefreshToken } from '../entities/refresh-token.entity';

export class SessionResponseDto {
  @ApiProperty({
    description: 'Session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'IP address of the device',
    example: '192.168.1.100',
    nullable: true,
  })
  ipAddress: string | null;

  @ApiProperty({
    description: 'User agent of the device/browser',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
    nullable: true,
  })
  userAgent: string | null;

  @ApiProperty({
    description: 'When the session was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the session was last used',
    example: '2024-01-16T14:20:00.000Z',
    nullable: true,
  })
  lastUsedAt: Date | null;

  @ApiProperty({
    description: 'When the session expires',
    example: '2024-02-15T10:30:00.000Z',
  })
  expiresAt: Date;

  static fromEntity(refreshToken: RefreshToken): SessionResponseDto {
    return {
      id: refreshToken.id,
      ipAddress: refreshToken.ipAddress,
      userAgent: refreshToken.userAgent,
      createdAt: refreshToken.createdAt,
      lastUsedAt: refreshToken.lastUsedAt,
      expiresAt: refreshToken.expiresAt,
    };
  }
}
