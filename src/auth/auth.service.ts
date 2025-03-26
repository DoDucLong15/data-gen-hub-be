import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenRequest, SignInDto } from './dtos/sign-in.dto';
import { SignInResponse } from './types/signin-response.type';
import { UsersService } from 'src/users/users.service';
import axios from 'axios';
import { ApiEndpoints } from './constants/api.const';
import { ConfigService } from '@nestjs/config';
import { RoleTypes } from 'src/users/enums/role-types.enum';
import { JwtService } from '@nestjs/jwt';
import { UserPayload } from './types/user-playload.type';
import { MailerService } from 'src/mailer/mailer.service';
import { CreateUserDto } from 'src/users/dtos/user.dto';
import { SystemConfigUtils } from 'src/system-configuration/utils/system-config.util';
import { TemplateHelper } from 'src/mailer/helpers/template.helper';
import { BaseResponse } from 'src/base/types/response.type';
import { RegisterService } from 'src/users/sub-services/register.service';
import { SystemConfigurationService } from 'src/system-configuration/system-configuration.service';
import { DATA_CONNECTOR_ONEDRIVE } from './constants/data-connector.const';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly registerService: RegisterService,
    private readonly systemConfigService: SystemConfigurationService,
  ) {}

  async signIn(request: SignInDto): Promise<SignInResponse> {
    try {
      const response = await axios.get(ApiEndpoints.SIGN_IN, {
        params: {
          taikhoan: request.email,
          matkhau: request.password,
        },
      });
      if (response.status !== 200 || parseInt(response.data) !== 1) {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      throw new UnauthorizedException();
    }
    const user = await this.usersService.getUser({
      where: { email: request.email },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const tokens = await this.getTokens(user.email, user.roleName);

    return tokens;
  }

  async getTokens(email: string, role: string): Promise<SignInResponse> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          email,
          role: role,
        },
        {
          secret: this.configService.get<string>('auth.jwtAccessSecret'),
          expiresIn: '1h',
        },
      ),
      this.jwtService.signAsync(
        {
          email,
          role: role,
        },
        {
          secret: this.configService.get<string>('auth.jwtRefreshSecret'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(request: RefreshTokenRequest) {
    try {
      const payload = await this.jwtService.verifyAsync<UserPayload>(request.refreshToken, {
        secret: this.configService.get<string>('auth.jwtRefreshSecret'),
      });
      return this.getTokens(payload.email, payload.role);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async register(request: CreateUserDto): Promise<BaseResponse> {
    const existingUser = await this.usersService.getUser({
      where: { email: request.email },
      withDeleted: true,
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
    const existingRegister = await this.registerService.getRegister({
      where: { email: request.email },
    });
    if (existingRegister) {
      throw new BadRequestException('Register already exists');
    }
    await this.registerService.createRegister(request);
    if (SystemConfigUtils.adminEmails.length === 0) {
      Logger.warn('No admin emails found', 'AuthService');
    } else {
      this.mailerService
        .sendEmail({
          to: SystemConfigUtils.adminEmails.join(','),
          subject: 'New user registered',
          content: TemplateHelper.getTemplateNotifyAdminNewUser(request),
        })
        .catch((error) => {
          Logger.error(error, 'AuthService.register');
        });
    }
    return {
      status: 'success',
      message: 'User registered successfully',
    };
  }

  async updateOnedriveAccessToken(data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }) {
    const dataConnector = await this.systemConfigService.get(DATA_CONNECTOR_ONEDRIVE);
    if (dataConnector) {
      dataConnector.jsonValue = data;
      await this.systemConfigService.update(dataConnector);
    } else {
      await this.systemConfigService.create({
        key: DATA_CONNECTOR_ONEDRIVE,
        jsonValue: data,
      });
    }
  }

  getOnedriveAuthUrl() {
    const url = new URL(
      `https://login.microsoftonline.com/${process.env.ONEDRIVE_TENANT_ID}/oauth2/v2.0/authorize`,
    );
    url.searchParams.append('client_id', process.env.ONEDRIVE_CLIENT_ID || '');
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('redirect_uri', process.env.ONEDRIVE_REDIRECT_URI || '');
    url.searchParams.append('scope', 'User.Read Files.ReadWrite.All offline_access');
    url.searchParams.append('response_mode', 'query');

    return url.toString();
  }

  async processOnedriveCallback(authCode: string): Promise<any> {
    const url = `https://login.microsoftonline.com/${process.env.ONEDRIVE_TENANT_ID}/oauth2/v2.0/token`;
    const data = new URLSearchParams({
      client_id: process.env.ONEDRIVE_CLIENT_ID || '',
      client_secret: process.env.ONEDRIVE_CLIENT_SECRET || '',
      redirect_uri: process.env.ONEDRIVE_REDIRECT_URI || '',
      grant_type: 'authorization_code',
      code: authCode,
    });

    const response = await axios.post(url, data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const fetchData = response.data;
    const accessToken = fetchData.access_token;
    const refreshToken = fetchData.refresh_token;
    const expiresIn = fetchData.expires_in;
    await this.updateOnedriveAccessToken({
      accessToken,
      refreshToken,
      expiresIn,
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    };
  }

  async healthCheckOnedrive() {
    const dataConnector = await this.systemConfigService.get(DATA_CONNECTOR_ONEDRIVE);
    if (!dataConnector) {
      Logger.warn('No onedrive data connector found', 'AuthService');
      return;
    }
    try {
      const url = `https://graph.microsoft.com/v1.0/me/drive/root/children`;
      await axios.get(url, {
        headers: {
          Authorization: `Bearer ${dataConnector.jsonValue.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      Logger.verbose('Onedrive access token is valid', 'AuthService');
      return {
        status: 'success',
        message: 'Onedrive access token is valid',
      };
    } catch (error) {
      Logger.error(error, 'AuthService.healthCheckOnedrive');
      await this.refreshOnedriveAccessToken(dataConnector.jsonValue.refreshToken);
      return {
        status: 'success',
        message: 'Onedrive access token is refreshed',
      };
    }
  }

  // Health check
  async refreshOnedriveAccessToken(refreshToken: string) {
    const url = `https://login.microsoftonline.com/${process.env.ONEDRIVE_TENANT_ID}/oauth2/v2.0/token`;
    const data = new URLSearchParams({
      client_id: process.env.ONEDRIVE_CLIENT_ID || '',
      client_secret: process.env.ONEDRIVE_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await axios.post(url, data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const fetchData = response.data;
    const accessToken = fetchData.access_token;
    const newRefreshToken = fetchData.refresh_token;
    const expiresIn = fetchData.expires_in;
    await this.updateOnedriveAccessToken({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    });
    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: expiresIn,
    };
  }
}
