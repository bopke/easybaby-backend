import { IsEmail, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'recipient@example.com',
  })
  @IsEmail()
  to: string;

  @ApiProperty({
    description: 'Email subject',
    example: 'Welcome to our platform',
  })
  @IsString()
  subject: string;

  @ApiPropertyOptional({
    description: 'Plain text content',
    example: 'Welcome to our platform! We are glad to have you.',
  })
  @IsOptional()
  @IsString()
  textContent?: string;

  @ApiPropertyOptional({
    description: 'HTML content',
    example: '<h1>Welcome!</h1><p>We are glad to have you.</p>',
  })
  @IsOptional()
  @IsString()
  htmlContent?: string;

  @ApiPropertyOptional({
    description: 'Sender name',
    example: 'Workshop Platform',
  })
  @IsOptional()
  @IsString()
  senderName?: string;

  @ApiPropertyOptional({
    description: 'Sender email address (must be verified in Brevo)',
    example: 'noreply@example.com',
  })
  @IsOptional()
  @IsEmail()
  senderEmail?: string;

  @ApiPropertyOptional({
    description: 'CC recipients',
    example: ['cc1@example.com', 'cc2@example.com'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiPropertyOptional({
    description: 'BCC recipients',
    example: ['bcc1@example.com'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];
}
