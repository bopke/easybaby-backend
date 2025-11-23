import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../email/services/email.service';
import { ContactUsDto } from '../dtos';
import { ContactUs } from '../entities';

@Injectable()
export class ContactUsService {
  private readonly logger = new Logger(ContactUsService.name);

  constructor(
    @InjectRepository(ContactUs)
    private readonly contactUsRepository: Repository<ContactUs>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async submitContactForm(contactUsDto: ContactUsDto): Promise<void> {
    const contactEmail = this.configService.get<string>('email.contactEmail');

    if (!contactEmail) {
      this.logger.error('Contact email not configured');
      throw new Error('Contact email not configured');
    }

    this.logger.log(
      `Processing contact form submission from ${contactUsDto.email}`,
    );

    const contactUs = this.contactUsRepository.create({
      name: contactUsDto.name,
      email: contactUsDto.email,
      message: contactUsDto.message,
    });

    await this.contactUsRepository.save(contactUs);
    this.logger.log(
      `Contact form submission saved to database with ID: ${contactUs.id}`,
    );

    try {
      await this.emailService.sendTemplateMail(
        'contact_us',
        contactEmail,
        `Contact Form Submission from ${contactUsDto.name}`,
        {
          name: contactUsDto.name,
          email: contactUsDto.email,
          message: contactUsDto.message,
        },
      );

      this.logger.log(
        `Contact form email sent successfully to ${contactEmail} from ${contactUsDto.email}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to send contact form email from ${contactUsDto.email}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
