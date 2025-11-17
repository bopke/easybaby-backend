import { ApiProperty } from '@nestjs/swagger';
import { Trainer } from '../entities';

export class TrainerResponseDto {
  @ApiProperty({
    description: 'Trainer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Trainer name',
    example: 'Jan Kowalski',
  })
  name: string;

  @ApiProperty({
    description: 'Certification level',
    example: 'Certyfikat',
  })
  level: string;

  @ApiProperty({
    description: 'Voivodeship (Polish administrative region)',
    example: 'Mazowieckie',
  })
  voivodeship: string;

  @ApiProperty({
    description: 'City or cities served',
    example: 'Warszawa',
  })
  city: string;

  @ApiProperty({
    description: 'Contact email',
    example: 'trainer@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Website or Facebook page',
    example: 'https://example.com',
    nullable: true,
  })
  site?: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+48 123 456 789',
    nullable: true,
  })
  phone?: string;

  @ApiProperty({
    description: 'Additional services offered',
    example: 'Individual training sessions',
    nullable: true,
  })
  additionalOffer?: string;

  @ApiProperty({
    description: 'Certification expiration date',
    example: '2025-12-31',
    nullable: true,
  })
  expirationDate?: Date;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Available on weekends',
    nullable: true,
  })
  notes?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;

  constructor(trainer: Trainer) {
    this.id = trainer.id;
    this.name = trainer.name;
    this.level = trainer.level;
    this.voivodeship = trainer.voivodeship;
    this.city = trainer.city;
    this.email = trainer.email;
    this.site = trainer.site;
    this.phone = trainer.phone;
    this.additionalOffer = trainer.additionalOffer;
    this.expirationDate = trainer.expirationDate;
    this.notes = trainer.notes;
    this.createdAt = trainer.createdAt;
    this.updatedAt = trainer.updatedAt;
  }

  static fromEntity(trainer: Trainer): TrainerResponseDto {
    return new TrainerResponseDto(trainer);
  }

  static fromEntities(trainers: Trainer[]): TrainerResponseDto[] {
    return trainers.map((trainer) => new TrainerResponseDto(trainer));
  }
}
