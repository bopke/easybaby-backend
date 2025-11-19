import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dtos';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Authenticated user information',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Refresh token expiration time in seconds',
    example: 2592000, // 30 days
  })
  refreshTokenExpiresIn: number;

  constructor(
    accessToken: string,
    user: UserResponseDto,
    expiresIn: number = 3600,
    refreshToken: string,
    refreshTokenExpiresIn: number,
  ) {
    this.accessToken = accessToken;
    this.tokenType = 'Bearer';
    this.expiresIn = expiresIn;
    this.user = user;
    this.refreshToken = refreshToken;
    this.refreshTokenExpiresIn = refreshTokenExpiresIn;
  }
}
