import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContactUsService } from '../services/contact_us.service';
import { ContactUsDto } from '../dtos';
import { Public } from '../../auth/guards';

@ApiTags('Contact Us')
@Controller('contact-us')
export class ContactUsController {
  constructor(private readonly contactUsService: ContactUsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Submit contact form',
    description:
      'Public endpoint for users to submit contact form. Sends an email to the configured contact email address.',
  })
  @ApiResponse({
    status: 204,
    description: 'Contact form submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - Failed to send email',
  })
  async submitContactForm(@Body() contactUsDto: ContactUsDto): Promise<void> {
    await this.contactUsService.submitContactForm(contactUsDto);
  }
}
