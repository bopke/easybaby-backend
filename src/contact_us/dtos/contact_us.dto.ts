import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsNotDisposableEmail } from '../../common/validators/is-not-disposable-email.validator';

export class ContactUsDto {
  @ApiProperty({
    description: 'Cloudflare Turnstile token for bot protection',
    example: 'turnstile-token-from-frontend',
  })
  @IsNotEmpty()
  @IsString()
  turnstileToken: string;

  @ApiProperty({
    description: 'Name of the person contacting us',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Email address of the person contacting us',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  @IsNotDisposableEmail({
    message: 'Disposable email addresses are not allowed',
  })
  email: string;

  @ApiProperty({
    description: 'Content of the message',
    example: 'I would like to know more about your workshops...',
  })
  @IsNotEmpty()
  @IsString()
  message: string;
}
