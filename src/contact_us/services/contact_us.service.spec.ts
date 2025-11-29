import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ContactUsService } from './contact_us.service';
import { EmailService } from '../../email/services/email.service';
import { ContactUsDto } from '../dtos';
import { ContactUs } from '../entities';
import { createMockContactUs } from '../mocks';

describe('ContactUsService', () => {
  let service: ContactUsService;
  let repository: Repository<ContactUs>;
  let emailService: EmailService;
  let configService: ConfigService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEmailService = {
    sendTemplateMail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactUsService,
        {
          provide: getRepositoryToken(ContactUs),
          useValue: mockRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ContactUsService>(ContactUsService);
    repository = module.get<Repository<ContactUs>>(
      getRepositoryToken(ContactUs),
    );
    emailService = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitContactForm', () => {
    const contactUsDto: ContactUsDto = {
      turnstileToken: 'test-turnstile-token',
      name: 'John Doe',
      email: 'john.doe@example.com',
      message: 'I would like to know more about your workshops.',
    };

    const contactEmail = 'contact@example.com';

    it('should save to database and send contact form email successfully', async () => {
      const mockContactUs = createMockContactUs({
        name: contactUsDto.name,
        email: contactUsDto.email,
        message: contactUsDto.message,
      });

      const getSpy = jest
        .spyOn(configService, 'get')
        .mockReturnValue(contactEmail);
      const createSpy = jest
        .spyOn(repository, 'create')
        .mockReturnValue(mockContactUs);
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockContactUs);
      const sendSpy = jest
        .spyOn(emailService, 'sendTemplateMail')
        .mockResolvedValue(undefined);
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await service.submitContactForm(contactUsDto);

      expect(getSpy).toHaveBeenCalledWith('email.contactEmail');
      expect(createSpy).toHaveBeenCalledWith({
        name: contactUsDto.name,
        email: contactUsDto.email,
        message: contactUsDto.message,
      });
      expect(saveSpy).toHaveBeenCalledWith(mockContactUs);
      expect(sendSpy).toHaveBeenCalledWith(
        'contact_us',
        contactEmail,
        'Contact Form Submission from John Doe',
        {
          name: contactUsDto.name,
          email: contactUsDto.email,
          message: contactUsDto.message,
        },
      );
      expect(logSpy).toHaveBeenCalledWith(
        'Processing contact form submission from john.doe@example.com',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'Contact form submission saved to database with ID: test-uuid',
      );
      expect(logSpy).toHaveBeenCalledWith(
        `Contact form email sent successfully to ${contactEmail} from john.doe@example.com`,
      );
    });

    it('should throw error if contact email is not configured', async () => {
      const getSpy = jest.spyOn(configService, 'get').mockReturnValue(null);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const createSpy = jest.spyOn(repository, 'create');
      const saveSpy = jest.spyOn(repository, 'save');

      await expect(service.submitContactForm(contactUsDto)).rejects.toThrow(
        'Contact email not configured',
      );

      expect(getSpy).toHaveBeenCalledWith('email.contactEmail');
      expect(errorSpy).toHaveBeenCalledWith('Contact email not configured');
      expect(createSpy).not.toHaveBeenCalled();
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should save to database but handle email sending errors', async () => {
      const mockContactUs = createMockContactUs({
        name: contactUsDto.name,
        email: contactUsDto.email,
        message: contactUsDto.message,
      });
      const error = new Error('Email service unavailable');

      const getSpy = jest
        .spyOn(configService, 'get')
        .mockReturnValue(contactEmail);
      const createSpy = jest
        .spyOn(repository, 'create')
        .mockReturnValue(mockContactUs);
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockContactUs);
      const sendSpy = jest
        .spyOn(emailService, 'sendTemplateMail')
        .mockRejectedValue(error);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(service.submitContactForm(contactUsDto)).rejects.toThrow(
        'Email service unavailable',
      );

      expect(getSpy).toHaveBeenCalledWith('email.contactEmail');
      expect(createSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to send contact form email from john.doe@example.com: Email service unavailable',
        error.stack,
      );
    });

    it('should save to database but handle non-Error exceptions', async () => {
      const mockContactUs = createMockContactUs({
        name: contactUsDto.name,
        email: contactUsDto.email,
        message: contactUsDto.message,
      });

      const getSpy = jest
        .spyOn(configService, 'get')
        .mockReturnValue(contactEmail);
      const createSpy = jest
        .spyOn(repository, 'create')
        .mockReturnValue(mockContactUs);
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockContactUs);
      const sendSpy = jest
        .spyOn(emailService, 'sendTemplateMail')
        .mockRejectedValue('Unknown error');
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(service.submitContactForm(contactUsDto)).rejects.toBe(
        'Unknown error',
      );

      expect(getSpy).toHaveBeenCalledWith('email.contactEmail');
      expect(createSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to send contact form email from john.doe@example.com: Unknown error',
        undefined,
      );
    });
  });
});
