import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: number;
  username: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
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
    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }
}
