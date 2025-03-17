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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
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
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
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
}
