import { Body, Controller, Get, Logger, Post, Query, Redirect, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshTokenRequest, SignInDto } from './dtos/sign-in.dto';
import { SignInResponse } from './types/signin-response.type';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dtos/user.dto';
import { BaseResponse } from 'src/base/types/response.type';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  async signIn(@Body() request: SignInDto): Promise<SignInResponse> {
    return await this.authService.signIn(request);
  }

  @Post('refresh-token')
  async refreshToken(@Body() request: RefreshTokenRequest): Promise<SignInResponse> {
    return await this.authService.refreshTokens(request);
  }

  @Post('register')
  async register(@Body() request: CreateUserDto): Promise<BaseResponse> {
    return await this.authService.register(request);
  }

  @Get('onedrive/login')
  @Redirect()
  login() {
    return { url: this.authService.getOnedriveAuthUrl() };
  }

  @Get('onedrive')
  async getOnedrive(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is missing' });
    }

    try {
      const tokens = await this.authService.processOnedriveCallback(code);
      return tokens;
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get access token' });
    }
  }

  @Post('onedrive/health-check')
  async healthCheckOnedrive() {
    return await this.authService.healthCheckOnedrive();
  }
}
