import { ApiProperty } from '@nestjs/swagger';
import { Expose, instanceToPlain } from 'class-transformer';
import { Trainer } from '../entities';

export class TrainerResponseDto {
  @ApiProperty({
    description: 'Trainer ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  id: string;

  @ApiProperty({
    description: 'Trainer name',
    example: 'Jan Kowalski',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  name: string;

  @ApiProperty({
    description: 'Voivodeship (Polish administrative region)',
    example: 'Mazowieckie',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  voivodeship: string;

  @ApiProperty({
    description: 'City or cities served',
    example: 'Warszawa',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  city: string;

  @ApiProperty({
    description: 'Contact email (visible to authenticated users)',
    example: 'trainer@example.com',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  email: string;

  @ApiProperty({
    description: 'Website or Facebook page (visible to authenticated users)',
    example: 'https://example.com',
    nullable: true,
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  site?: string;

  @ApiProperty({
    description: 'Contact phone number (visible to authenticated users)',
    example: '+48 123 456 789',
    nullable: true,
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  phone?: string;

  @ApiProperty({
    description: 'Additional services offered (visible to authenticated users)',
    example: 'Individual training sessions',
    nullable: true,
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  additionalOffer?: string;

  @ApiProperty({
    description: 'Verification status of the trainer (admin only)',
    example: false,
  })
  @Expose({ groups: ['admin'] })
  isVerified: boolean;

  @ApiProperty({
    description: 'Additional notes (admin only)',
    example: 'Available on weekends',
    nullable: true,
  })
  @Expose({ groups: ['admin'] })
  notes?: string;

  @ApiProperty({
    description: 'Creation timestamp (admin only)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose({ groups: ['admin'] })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp (admin only)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose({ groups: ['admin'] })
  updatedAt: Date;

  constructor(trainer: Trainer) {
    this.id = trainer.id;
    this.name = trainer.name;
    this.voivodeship = trainer.voivodeship;
    this.city = trainer.city;
    this.email = trainer.email;
    this.site = trainer.site;
    this.phone = trainer.phone;
    this.additionalOffer = trainer.additionalOffer;
    this.isVerified = trainer.isVerified;
    this.notes = trainer.notes;
    this.createdAt = trainer.createdAt;
    this.updatedAt = trainer.updatedAt;
  }

  static fromEntity(trainer: Trainer): TrainerResponseDto;
  static fromEntity(trainer: Trainer, groups: string[]): Record<string, any>;
  static fromEntity(
    trainer: Trainer,
    groups?: string[],
  ): TrainerResponseDto | Record<string, any> {
    const dto = new TrainerResponseDto(trainer);
    if (groups) {
      return instanceToPlain(dto, { groups });
    }
    return dto;
  }

  static fromEntities(trainers: Trainer[]): TrainerResponseDto[];
  static fromEntities(
    trainers: Trainer[],
    groups: string[],
  ): Array<Record<string, any>>;
  static fromEntities(
    trainers: Trainer[],
    groups?: string[],
  ): TrainerResponseDto[] | Array<Record<string, any>> {
    const dtos = trainers.map((trainer) => new TrainerResponseDto(trainer));
    if (groups) {
      return dtos.map((dto) => instanceToPlain(dto, { groups }));
    }
    return dtos;
  }
}
