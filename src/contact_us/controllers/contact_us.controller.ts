import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ContactUsService } from '../services/contact_us.service';
import { ContactUsDto } from '../dtos';
import { Public } from '../../auth/guards';
import { TurnstileGuard } from '../../common/guards';

@ApiTags('Contact Us')
@Controller('contact-us')
export class ContactUsController {
  constructor(private readonly contactUsService: ContactUsService) {}

  @Public()
  @UseGuards(TurnstileGuard)
  @SkipThrottle({ default: true })
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Submit contact form',
    description:
      'Public endpoint for users to submit contact form. Protected by Cloudflare Turnstile, rate limited to 3 submissions per hour, and blocks disposable email addresses.',
  })
  @ApiResponse({
    status: 204,
    description: 'Contact form submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data or disposable email',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing Turnstile token',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded (3 per hour)',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - Failed to send email',
  })
  async submitContactForm(@Body() contactUsDto: ContactUsDto): Promise<void> {
    await this.contactUsService.submitContactForm(contactUsDto);
  }
}
