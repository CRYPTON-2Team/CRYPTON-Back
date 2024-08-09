import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: '로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiBody({ type: LoginDto })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.login(
      req.user,
    );

    res.cookie('accessToken', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 * 7,
    });

    return { message: access_token };
  }

  @ApiOperation({ summary: '프로필 조회' })
  @ApiResponse({ status: 200, description: '프로필 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('logout')
  @HttpCode(HttpStatus.OK)
  async logOut(@Req() req, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.id);
    this._clearTokenCookies(res);
    return { message: '로그아웃 성공' };
  }

  @ApiOperation({ summary: '액세스토큰 재발급' })
  @ApiResponse({ status: 200, description: '재발급 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiBearerAuth()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async reissueAccessToken(@Request() req) {
    const { id } = req.user;
    console.log(2);
    const result = await this.authService.reissueAccessToken(id);
    return {
      message: '토큰 재발급 성공',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  private _clearTokenCookies(res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }
}
