import { Injectable } from '@nestjs/common';
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

    return sendResult;
  }
}
