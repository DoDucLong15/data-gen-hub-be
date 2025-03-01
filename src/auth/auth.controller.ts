import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshTokenRequest, SignInDto } from './dtos/sign-in.dto';
import { SignInResponse } from './types/signin-response.type';
import { ApiTags } from '@nestjs/swagger';

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
}
