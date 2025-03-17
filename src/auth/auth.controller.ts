import { Body, Controller, Logger, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshTokenRequest, SignInDto } from './dtos/sign-in.dto';
import { SignInResponse } from './types/signin-response.type';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dtos/user.dto';
import { BaseResponse } from 'src/base/types/response.type';

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
}
