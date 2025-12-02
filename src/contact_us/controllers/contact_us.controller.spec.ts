import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ContactUsController } from './contact_us.controller';
import { ContactUsService } from '../services/contact_us.service';
import { ContactUsDto } from '../dtos';
import { TurnstileService } from '../../common/services/turnstile.service';

describe('ContactUsController', () => {
  let controller: ContactUsController;
  let service: ContactUsService;

  const mockContactUsService = {
    submitContactForm: jest.fn(),
  };

  const mockTurnstileService = {
    verifyToken: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactUsController],
      providers: [
        {
          provide: ContactUsService,
          useValue: mockContactUsService,
        },
        {
          provide: TurnstileService,
          useValue: mockTurnstileService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<ContactUsController>(ContactUsController);
    service = module.get<ContactUsService>(ContactUsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitContactForm', () => {
    const contactUsDto: ContactUsDto = {
      turnstileToken: 'test-turnstile-token',
      name: 'John Doe',
      email: 'john.doe@example.com',
      message: 'I would like to know more about your workshops.',
    };

    it('should submit contact form successfully', async () => {
      const submitSpy = jest
        .spyOn(service, 'submitContactForm')
        .mockResolvedValue(undefined);

      await controller.submitContactForm(contactUsDto);

      expect(submitSpy).toHaveBeenCalledWith(contactUsDto);
    });

    it('should handle service errors', async () => {
      const error = new Error('Email service unavailable');
      const submitSpy = jest
        .spyOn(service, 'submitContactForm')
        .mockRejectedValue(error);

      await expect(controller.submitContactForm(contactUsDto)).rejects.toThrow(
        'Email service unavailable',
      );

      expect(submitSpy).toHaveBeenCalledWith(contactUsDto);
    });
  });
});
