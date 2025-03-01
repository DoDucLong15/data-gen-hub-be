export type MailerConfig = {
  googleOauthClientID: string;
  googleOauthClientSecret: string;
  googleMailerRefreshToken: string;
  googleMailerUser: string;
  googleMailerAccessToken: string;
};

export type SendEmailType = {
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  content: string;
  attachments?: {
    filename: string;
    encoding?: string | undefined;
    contentType?: string | undefined;
    content?: string | Buffer;
    raw?: string | Buffer;
  }[];
}

