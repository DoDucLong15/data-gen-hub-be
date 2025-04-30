import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Query,
  Redirect,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshTokenRequest, SignInDto } from './dtos/sign-in.dto';
import { SignInResponse } from './types/signin-response.type';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dtos/user.dto';
import { BaseResponse } from 'src/base/types/response.type';
import { Response } from 'express';
import { GoogleDriveGuard } from './guards/google.guard';

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
  // @Redirect()
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

      // Trả về HTML với script đóng cửa sổ và gửi message về parent window
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Xác thực thành công</title>
        </head>
        <body>
          <h3>Xác thực OneDrive thành công!</h3>
          <p>Cửa sổ này sẽ tự đóng...</p>
          <script>
            // Gửi thông báo thành công đến trang chính (nếu có)
            if (window.opener) {
              window.opener.postMessage({ 
                status: 'success', 
                type: 'onedrive-auth',
                data: ${JSON.stringify(tokens)}
              }, '*');
            }
            // Đóng cửa sổ popup sau 1 giây
            setTimeout(function() { window.close(); }, 1000);
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      Logger.error('OneDrive callback error:', error);
      // Trả về HTML với thông báo lỗi và script đóng cửa sổ
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Xác thực thất bại</title>
        </head>
        <body>
          <h3>Xác thực OneDrive thất bại!</h3>
          <p>Đã xảy ra lỗi: ${error.message || 'Không xác định'}</p>
          <script>
            // Gửi thông báo lỗi đến trang chính (nếu có)
            if (window.opener) {
              window.opener.postMessage({ 
                status: 'error', 
                type: 'onedrive-auth',
                error: '${error.message || 'Không xác định'}'
              }, '*');
            }
            // Đóng cửa sổ popup sau 3 giây để người dùng có thể đọc thông báo lỗi
            setTimeout(function() { window.close(); }, 3000);
          </script>
        </body>
        </html>
      `);
    }
  }

  @Get('google/drive')
  @UseGuards(GoogleDriveGuard)
  authGoogleDrive(): number {
    return HttpStatus.OK;
  }
}
