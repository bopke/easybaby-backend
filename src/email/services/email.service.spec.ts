import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { TransactionalEmailsApi } from '@getbrevo/brevo';
import { SendEmailDto } from '../dtos';
import * as fs from 'node:fs';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/entities/enums';

jest.mock('@getbrevo/brevo');
jest.mock('node:fs');

interface SentEmail {
  to?: Array<{ email: string }>;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  sender?: { name: string; email: string };
  cc?: Array<{ email: string }>;
  bcc?: Array<{ email: string }>;
}

describe('EmailService', () => {
  let service: EmailService;
  let mockApiInstance: {
    sendTransacEmail: jest.Mock<
      Promise<{ body: { messageId: string } }>,
      [SentEmail]
    >;
    setApiKey: jest.Mock;
  };
  let mockConfigService: { get: jest.Mock };

  beforeEach(async () => {
    mockApiInstance = {
      sendTransacEmail: jest.fn() as jest.Mock<
        Promise<{ body: { messageId: string } }>,
        [SentEmail]
      >,
      setApiKey: jest.fn(),
    };

    // Mock the TransactionalEmailsApi constructor
    (TransactionalEmailsApi as jest.Mock).mockImplementation(() => {
      return mockApiInstance;
    });

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          'email.brevoApiKey': 'test-api-key',
          'email.defaultSenderName': 'Workshop Platform',
          'email.defaultSenderEmail': 'noreply@test.com',
          nodeEnv: 'test',
          'app.url': 'http://localhost:3000',
        };
        return config[key] || defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send a simple email with HTML content', async () => {
      const emailDto: SendEmailDto = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test</h1>',
      };

      mockApiInstance.sendTransacEmail.mockResolvedValue({
        body: {
          messageId: 'test-message-id',
        },
      });

      await service.sendEmail(emailDto);

      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledTimes(1);
      const sentEmail = mockApiInstance.sendTransacEmail.mock.calls[0][0];

      expect(sentEmail.to).toEqual([{ email: 'recipient@example.com' }]);
      expect(sentEmail.subject).toBe('Test Subject');
      expect(sentEmail.htmlContent).toBe('<h1>Test</h1>');
      expect(sentEmail.sender).toEqual({
        name: 'Workshop Platform',
        email: 'noreply@test.com',
      });
    });

    it('should send email with text content', async () => {
      const emailDto: SendEmailDto = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        textContent: 'Plain text content',
      };

      mockApiInstance.sendTransacEmail.mockResolvedValue({
        body: {
          messageId: 'test-message-id',
        },
      });

      await service.sendEmail(emailDto);

      const sentEmail = mockApiInstance.sendTransacEmail.mock.calls[0][0];
      expect(sentEmail.textContent).toBe('Plain text content');
    });

    it('should send email with custom sender', async () => {
      const emailDto: SendEmailDto = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test</h1>',
        senderName: 'Custom Sender',
        senderEmail: 'custom@example.com',
      };

      mockApiInstance.sendTransacEmail.mockResolvedValue({
        body: {
          messageId: 'test-message-id',
        },
      });

      await service.sendEmail(emailDto);

      const sentEmail = mockApiInstance.sendTransacEmail.mock.calls[0][0];
      expect(sentEmail.sender).toEqual({
        name: 'Custom Sender',
        email: 'custom@example.com',
      });
    });

    it('should send email with CC recipients', async () => {
      const emailDto: SendEmailDto = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test</h1>',
        cc: ['cc1@example.com', 'cc2@example.com'],
      };

      mockApiInstance.sendTransacEmail.mockResolvedValue({
        body: {
          messageId: 'test-message-id',
        },
      });

      await service.sendEmail(emailDto);

      const sentEmail = mockApiInstance.sendTransacEmail.mock.calls[0][0];
      expect(sentEmail.cc).toEqual([
        { email: 'cc1@example.com' },
        { email: 'cc2@example.com' },
      ]);
    });

    it('should send email with BCC recipients', async () => {
      const emailDto: SendEmailDto = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test</h1>',
        bcc: ['bcc@example.com'],
      };

      mockApiInstance.sendTransacEmail.mockResolvedValue({
        body: {
          messageId: 'test-message-id',
        },
      });

      await service.sendEmail(emailDto);

      const sentEmail = mockApiInstance.sendTransacEmail.mock.calls[0][0];
      expect(sentEmail.bcc).toEqual([{ email: 'bcc@example.com' }]);
    });

    it('should throw error when email sending fails', async () => {
      const emailDto: SendEmailDto = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        htmlContent: '<h1>Test</h1>',
      };

      // Suppress error logging for this test
      const loggerErrorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      const error = new Error('API Error');
      mockApiInstance.sendTransacEmail.mockRejectedValue(error);

      await expect(() => service.sendEmail(emailDto)).rejects.toThrow(
        'API Error',
      );

      // Verify error was logged (even though we suppressed it)
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send email to recipient@example.com: API Error',
        expect.any(String),
      );

      loggerErrorSpy.mockRestore();
    });
  });

  describe('missing API key configuration', () => {
    let serviceWithoutKey: EmailService;

    beforeEach(async () => {
      const configWithoutKey = {
        get: jest.fn((key: string) => {
          const config: Record<string, string> = {
            'email.defaultSenderName': 'Workshop Platform',
            'email.defaultSenderEmail': 'noreply@test.com',
            nodeEnv: 'development',
            'app.url': 'http://localhost:3000',
          };
          return config[key];
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: configWithoutKey,
          },
        ],
      }).compile();

      serviceWithoutKey = module.get<EmailService>(EmailService);
    });

    it('should not initialize apiInstance when API key missing in non-production', () => {
      expect(serviceWithoutKey).toBeDefined();
      expect(serviceWithoutKey['apiInstance']).toBeUndefined();
    });

    it('should log error and return early when sending email without API key in non-production', async () => {
      const loggerErrorSpy = jest
        .spyOn(serviceWithoutKey['logger'], 'error')
        .mockImplementation();

      const emailDto: SendEmailDto = {
        to: 'test@example.com',
        subject: 'Test',
        htmlContent: '<h1>Test</h1>',
      };

      await serviceWithoutKey.sendEmail(emailDto);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Cannot send email to test@example.com: Brevo API key not configured',
      );

      loggerErrorSpy.mockRestore();
    });

    it('should throw error during initialization without API key in production', async () => {
      // Create a production config without API key
      const productionConfigWithoutKey = {
        get: jest.fn((key: string) => {
          const config: Record<string, string> = {
            'email.defaultSenderName': 'Workshop Platform',
            'email.defaultSenderEmail': 'noreply@test.com',
            nodeEnv: 'production',
            'app.url': 'http://localhost:3000',
          };
          return config[key];
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            EmailService,
            {
              provide: ConfigService,
              useValue: productionConfigWithoutKey,
            },
          ],
        }).compile(),
      ).rejects.toThrow('Email api key not configured');
    });
  });

  describe('sendTemplateMail', () => {
    const mockTemplateContent = '<h1>Hello {{user.email}}</h1>';
    const mockUser: User = {
      id: '123',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: UserRole.NORMAL,
      emailVerificationCode: 'ABC123',
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      // Mock fs.readFileSync to return template content
      (fs.readFileSync as jest.Mock).mockReturnValue(mockTemplateContent);

      mockApiInstance.sendTransacEmail.mockResolvedValue({
        body: {
          messageId: 'test-message-id',
        },
      });
    });

    it('should load and compile template on first call', async () => {
      await service.sendTemplateMail(
        'registration',
        'test@example.com',
        'Welcome!',
        { user: mockUser },
      );

      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('registration.hbs'),
        'utf8',
      );
      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [{ email: 'test@example.com' }],
          subject: 'Welcome!',
          htmlContent: '<h1>Hello test@example.com</h1>',
        }),
      );
    });

    it('should use cached template on subsequent calls', async () => {
      // First call - loads and compiles
      await service.sendTemplateMail(
        'registration',
        'user1@example.com',
        'Welcome!',
        { user: { ...mockUser, email: 'user1@example.com' } },
      );

      expect(fs.readFileSync).toHaveBeenCalledTimes(1);

      // Second call - uses cache
      await service.sendTemplateMail(
        'registration',
        'user2@example.com',
        'Welcome!',
        { user: { ...mockUser, email: 'user2@example.com' } },
      );

      // fs.readFileSync should still only be called once
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);

      // Both emails should be sent with correct content
      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledTimes(2);
      expect(mockApiInstance.sendTransacEmail).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          htmlContent: '<h1>Hello user1@example.com</h1>',
        }),
      );
      expect(mockApiInstance.sendTransacEmail).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          htmlContent: '<h1>Hello user2@example.com</h1>',
        }),
      );
    });

    it('should cache different templates separately', async () => {
      await service.sendTemplateMail(
        'registration',
        'test@example.com',
        'Welcome!',
        { user: mockUser },
      );

      (fs.readFileSync as jest.Mock).mockReturnValue(
        '<p>Password reset: {{token}}</p>',
      );

      await service.sendTemplateMail(
        'password-reset',
        'test@example.com',
        'Reset Password',
        { token: 'abc123' },
      );

      // Should have read two different templates
      expect(fs.readFileSync).toHaveBeenCalledTimes(2);
      expect(fs.readFileSync).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('registration.hbs'),
        'utf8',
      );
      expect(fs.readFileSync).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('password-reset.hbs'),
        'utf8',
      );
    });
  });

  describe('sendRegistrationEmail', () => {
    const mockUser: User = {
      id: '123',
      email: 'newuser@example.com',
      password: 'hashedpassword',
      role: UserRole.NORMAL,
      emailVerificationCode: 'ABC123',
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      (fs.readFileSync as jest.Mock).mockReturnValue(
        '<h1>Welcome {{user.email}}</h1>',
      );

      mockApiInstance.sendTransacEmail.mockResolvedValue({
        body: {
          messageId: 'test-message-id',
        },
      });
    });

    it('should send registration email with correct template and context', async () => {
      await service.sendRegistrationEmail(mockUser);

      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [{ email: 'newuser@example.com' }],
          subject: 'Welcome to the app!',
          htmlContent: '<h1>Welcome newuser@example.com</h1>',
        }),
      );
    });
  });
});
