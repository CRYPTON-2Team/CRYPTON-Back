import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headerToken = this.extractTokenFromHeader(request);
    const cookieToken = this.extractTokenFromCookie(request);
    console.log('Header Token:', headerToken);
    console.log('Cookie Token:', cookieToken);
    const refreshToken = cookieToken || headerToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      console.log(payload);
      console.log(`refresh:`, refreshToken);

      // Redis에서 저장된 리프레시 토큰과 비교
      const storedToken = await this.authService.getRefreshToken(payload.sub);
      console.log(`stored:`, storedToken);
      if (refreshToken !== storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      request['user'] = { userId: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractTokenFromCookie(request: any): string | undefined {
    return request.cookies['refreshToken'];
  }
}
