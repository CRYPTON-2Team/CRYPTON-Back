import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';

interface JwtPayload {
  sub: number;
  username: string;
  iat: number;
  exp: number;
  jti: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpriation: false,
      secretOrKey: configService.get<string>('JWT_SECRET_KEY'),
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTimestamp) {
      throw new UnauthorizedException('Token has expired');
    }
    const user = await this.usersService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isBlacklisted = await this.authService.isTokenBlacklisted(
      payload.jti,
    );
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }
    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }
}
