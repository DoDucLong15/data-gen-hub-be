import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import { MailerConfig, SendEmailType } from './types/mailer-config.type';

@Injectable()
export class MailerService {
  constructor(private readonly configService: ConfigService) {}

  private getGmailTransport(
    config: MailerConfig,
  ): nodemailer.Transporter<SMTPTransport.SentMessageInfo> {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.googleMailerUser,
        pass: config.googleMailerPassword,
      },
    });
  }

  async sendEmail(data: SendEmailType): Promise<SMTPTransport.SentMessageInfo> {
    try {
      Logger.verbose(
        `Sending email to ${data.to} with subject ${data.subject}`,
        'MailerService.sendEmail',
      );
      const config = this.configService.get<MailerConfig>('mailer');
      const transport = this.getGmailTransport(config!);

      const sendResult = await transport.sendMail({
        from: config?.googleMailerUser,
        to: data.to,
        bcc: data.bcc,
        cc: data.cc,
        subject: data.subject,
        html: data.content,
        attachments: data.attachments,
      });
      Logger.verbose(
        `Email sent to ${data.to} with subject ${data.subject} successfully`,
        'MailerService.sendEmail',
      );
      return sendResult;
    } catch (error) {
      Logger.error(
        `Failed to send email to ${data.to} with subject ${data.subject}`,
        'MailerService.sendEmail',
      );
      throw new Error(
        `Failed to send email to ${data.to} with subject ${data.subject}: ${error.message}`,
      );
    }
  }
}
