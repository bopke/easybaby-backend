import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { TransactionalEmailsApi } from '@getbrevo/brevo';
import { SendEmailDto } from '../dtos';

jest.mock('@getbrevo/brevo');

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
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
          },
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
});
