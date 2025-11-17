import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterTrainerDto {
  @ApiPropertyOptional({
    description: 'Filter by trainer name (partial match)',
    example: 'Jan',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by voivodeship (partial match)',
    example: 'Mazowieckie',
  })
  @IsOptional()
  @IsString()
  voivodeship?: string;

  @ApiPropertyOptional({
    description: 'Filter by city (partial match)',
    example: 'Warszawa',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by email (partial match)',
    example: 'jan@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter by website (partial match)',
    example: 'example.com',
  })
  @IsOptional()
  @IsString()
  site?: string;

  @ApiPropertyOptional({
    description: 'Filter by phone number (partial match)',
    example: '+48 123',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Filter by additional offer (partial match)',
    example: 'Individual',
  })
  @IsOptional()
  @IsString()
  additionalOffer?: string;

  @ApiPropertyOptional({
    description: 'Filter by verification status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by notes (partial match)',
    example: 'Available',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
