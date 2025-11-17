import { IsOptional, IsArray, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class OrderTrainerDto {
  @ApiPropertyOptional({
    description:
      'Order trainers by field(s) in format "field:direction". ' +
      'Valid fields: name, level, voivodeship, city, email, site, phone, ' +
      'additionalOffer, expirationDate, notes, createdAt, updatedAt. ' +
      'Valid directions: asc, desc. ' +
      'Multiple values can be provided for multi-level sorting.',
    example: ['name:asc', 'createdAt:desc'],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }: { value: string | string[] }) => {
    // Handle single string or array of strings
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  @Matches(
    /^(name|level|voivodeship|city|email|site|phone|additionalOffer|expirationDate|notes|createdAt|updatedAt):(asc|desc)$/i,
    {
      each: true,
      message:
        'Each order must be in format "field:direction" where direction is asc or desc',
    },
  )
  order?: string[];
}
