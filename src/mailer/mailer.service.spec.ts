import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendEmailType } from './types/mailer-config.type';

// Mock nodemailer
jest.mock('nodemailer');

describe('MailerService', () => {
  let service: MailerService;
  let configService: ConfigService;

  // Mock data
  const mockMailerConfig = {
    googleMailerUser: 'test@gmail.com',
    googleMailerPassword: 'test-password',
  };

  // Mock transport
  const mockTransport = {
    sendMail: jest.fn(),
  };

  // Mock email data
  const mockEmailData: SendEmailType = {
    to: 'recipient@example.com',
    subject: 'Test Subject',
    content: '<p>Test Content</p>',
  };

  // Mock email result
  const mockSendResult = {
    messageId: 'test-message-id',
    envelope: {
      from: 'test@gmail.com',
      to: ['recipient@example.com'],
    },
    accepted: ['recipient@example.com'],
    rejected: [],
    pending: [],
    response: '250 OK',
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock nodemailer.createTransport to return our mock transport
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransport);

    // Mock transport.sendMail to return our mock result
    mockTransport.sendMail.mockResolvedValue(mockSendResult);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'mailer') return mockMailerConfig;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailerService>(MailerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    // Successfully send email
    it('should successfully send an email', async () => {
      // Act
      const result = await service.sendEmail(mockEmailData);

      // Assert
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        service: 'gmail',
        auth: {
          user: mockMailerConfig.googleMailerUser,
          pass: mockMailerConfig.googleMailerPassword,
        },
      });

      expect(mockTransport.sendMail).toHaveBeenCalledWith({
        from: mockMailerConfig.googleMailerUser,
        to: mockEmailData.to,
        bcc: undefined,
        cc: undefined,
        subject: mockEmailData.subject,
        html: mockEmailData.content,
        attachments: undefined,
      });

      expect(result).toEqual(mockSendResult);
    });

    // Handle missing config
    it('should throw an error when mailer config is missing', async () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValueOnce(null);

      // Act & Assert
      await expect(service.sendEmail(mockEmailData)).rejects.toThrow();
      expect(nodemailer.createTransport).not.toHaveBeenCalled();
      expect(mockTransport.sendMail).not.toHaveBeenCalled();
    });

    // Handle transport error
    it('should throw an error when transport fails to send email', async () => {
      // Arrange
      const errorMessage = 'Failed to send email';
      mockTransport.sendMail.mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(service.sendEmail(mockEmailData)).rejects.toThrow(errorMessage);
      expect(nodemailer.createTransport).toHaveBeenCalled();
      expect(mockTransport.sendMail).toHaveBeenCalled();
    });

    // Send with all optional fields
    it('should send email with all optional fields', async () => {
      // Arrange
      const completeEmailData: SendEmailType = {
        to: 'recipient@example.com',
        cc: ['cc1@example.com', 'cc2@example.com'],
        bcc: 'bcc@example.com',
        subject: 'Complete Test Subject',
        content: '<p>Complete Test Content</p>',
      };

      // Act
      await service.sendEmail(completeEmailData);

      // Assert
      expect(mockTransport.sendMail).toHaveBeenCalledWith({
        from: mockMailerConfig.googleMailerUser,
        to: completeEmailData.to,
        bcc: completeEmailData.bcc,
        cc: completeEmailData.cc,
        subject: completeEmailData.subject,
        html: completeEmailData.content,
        attachments: undefined,
      });
    });

    // Send with minimal required fields
    it('should send email with minimal required fields', async () => {
      // Arrange
      const minimalEmailData: SendEmailType = {
        subject: 'Minimal Subject',
        content: '<p>Minimal Content</p>',
      };

      // Act
      await service.sendEmail(minimalEmailData);

      // Assert
      expect(mockTransport.sendMail).toHaveBeenCalledWith({
        from: mockMailerConfig.googleMailerUser,
        to: undefined,
        bcc: undefined,
        cc: undefined,
        subject: minimalEmailData.subject,
        html: minimalEmailData.content,
        attachments: undefined,
      });
    });

    // Send with attachments
    it('should send email with attachments', async () => {
      // Arrange
      const emailWithAttachments: SendEmailType = {
        to: 'recipient@example.com',
        subject: 'Email with Attachments',
        content: '<p>Email with attachments</p>',
        attachments: [
          {
            filename: 'test.txt',
            content: 'Hello World',
            contentType: 'text/plain',
          },
          {
            filename: 'test.pdf',
            content: Buffer.from('PDF content'),
            contentType: 'application/pdf',
          },
        ],
      };

      // Act
      await service.sendEmail(emailWithAttachments);

      // Assert
      expect(mockTransport.sendMail).toHaveBeenCalledWith({
        from: mockMailerConfig.googleMailerUser,
        to: emailWithAttachments.to,
        bcc: undefined,
        cc: undefined,
        subject: emailWithAttachments.subject,
        html: emailWithAttachments.content,
        attachments: emailWithAttachments.attachments,
      });
    });
  });
});
