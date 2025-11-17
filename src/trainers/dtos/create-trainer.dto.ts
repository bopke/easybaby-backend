import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateTrainerDto {
  @ApiProperty({
    description: 'Trainer name',
    example: 'Jan Kowalski',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Certification level',
    example: 'Certyfikat',
  })
  @IsString()
  @IsNotEmpty()
  level: string;

  @ApiProperty({
    description: 'Voivodeship (Polish administrative region)',
    example: 'Mazowieckie',
  })
  @IsString()
  @IsNotEmpty()
  voivodeship: string;

  @ApiProperty({
    description: 'City or cities served',
    example: 'Warszawa',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Contact email',
    example: 'trainer@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Website or Facebook page',
    example: 'https://example.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  site?: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+48 123 456 789',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Additional services offered',
    example: 'Individual training sessions',
    required: false,
  })
  @IsString()
  @IsOptional()
  additionalOffer?: string;

  @ApiProperty({
    description: 'Certification expiration date',
    example: '2025-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Available on weekends',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
