import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SendSmtpEmail,
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
} from '@getbrevo/brevo';
import { SendEmailDto } from '../dtos';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiInstance: TransactionalEmailsApi;
  private readonly defaultSender: { name: string; email: string };

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('email.brevoApiKey');
    const environment = this.configService.get<string>('nodeEnv');
    if (!apiKey) {
      if (environment !== 'production') {
        this.logger.warn(
          'Brevo API key not configured - not sending anything!',
        );
        return;
      } else {
        throw new Error('Email api key not configured');
      }
    }

    this.apiInstance = new TransactionalEmailsApi();
    this.apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);

    // Set default sender (should be a verified sender in Brevo)
    this.defaultSender = {
      name: this.configService.get<string>('email.defaultSenderName')!,
      email: this.configService.get<string>('email.defaultSenderEmail')!,
    };
  }

  async sendEmail(emailDto: SendEmailDto): Promise<void> {
    const sendSmtpEmail = new SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: emailDto.senderName || this.defaultSender.name,
      email: emailDto.senderEmail || this.defaultSender.email,
    };

    sendSmtpEmail.to = [{ email: emailDto.to }];

    if (emailDto.cc && emailDto.cc.length > 0) {
      sendSmtpEmail.cc = emailDto.cc.map((email) => ({ email }));
    }

    if (emailDto.bcc && emailDto.bcc.length > 0) {
      sendSmtpEmail.bcc = emailDto.bcc.map((email) => ({ email }));
    }

    sendSmtpEmail.subject = emailDto.subject;

    if (emailDto.htmlContent) {
      sendSmtpEmail.htmlContent = emailDto.htmlContent;
    }
    if (emailDto.textContent) {
      sendSmtpEmail.textContent = emailDto.textContent;
    }

    try {
      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      this.logger.log(
        `Email sent successfully to ${emailDto.to}. Message ID: ${response.body?.messageId || 'N/A'}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to send email to ${emailDto.to}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
