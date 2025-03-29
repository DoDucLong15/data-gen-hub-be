import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';

@Injectable()
export class GoogleDriveStrategy extends PassportStrategy(Strategy, 'google-drive') {
  constructor() {
    super({
      clientID: process.env.GG_CLIENT_ID || '',
      clientSecret: process.env.GG_CLIENT_SECRET ?? '',
      callbackURL: process.env.GG_CALLBACK_URL ?? '',
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive'],
    });
  }

  authorizationParams(): { [key: string]: string } {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    done(null, { _accessToken, _refreshToken, profile });
  }
}
