import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const { id, username } = user;
    const payload = { username: username, sub: id, jti: uuidv4() };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.saveToken(id, accessToken, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async register(registerDto: RegisterDto) {
    const { password, username, email } = registerDto;
    if (!password || !username || !email) {
      throw new BadRequestException('빈칸을 채워주세요.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userToCreate = {
      ...registerDto,
      password: hashedPassword,
    };
    return await this.usersService.createUser(userToCreate);
  }

  async logout(userId: number): Promise<void> {
    await this.redis.del(`refreshToken:${userId}`);

    const accessToken = await this.redis.get(`accessToken:${userId}`);
    if (accessToken) {
      const decoded = this.jwtService.decode(accessToken) as {
        jti: string;
        exp: number;
      };
      if (decoded && decoded.jti) {
        const currentTime = Math.floor(Date.now() / 1000);
        const ttl = decoded.exp - currentTime;

        if (ttl > 0) {
          // jti(jwt uuid)를 사용하여 블랙리스트에 추가
          await this.redis.setex(`blacklist:${decoded.jti}`, ttl, 'true');
        }
      }
    }

    // AccessToken 정보 제거
    await this.redis.del(`accessToken:${userId}`);
  }

  async saveToken(
    userId: number,
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    const accessTokenDecoded = this.jwtService.decode(accessToken);
    const refreshTokenDecoded = this.jwtService.decode(refreshToken);
    const accessTokenExp = accessTokenDecoded['exp'];
    const refreshTokenExp = refreshTokenDecoded['exp'];
    const currentTime = Math.floor(Date.now() / 1000);

    await this.redis.setex(
      `accessToken:${userId}`,
      accessTokenExp - currentTime,
      accessToken,
    );
    await this.redis.setex(
      `refreshToken:${userId}`,
      refreshTokenExp - currentTime,
      refreshToken,
    );
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.redis.get(`blacklist:${token}`);
    return !!blacklisted;
  }

  async reissueAccessToken(
    userId: number,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    // 리프레시 토큰 확인
    const storedRefreshToken = await this.redis.get(`refreshToken:${userId}`);
    if (!storedRefreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // 리프레시 토큰 유효성 검증
    try {
      const decoded = this.jwtService.verify(storedRefreshToken);

      // 새 액세스 토큰 생성
      const newAccessToken = this.jwtService.sign({ sub: userId });

      // 리프레시 토큰 만료 시간 확인
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;

      let newRefreshToken: string | undefined;

      // 리프레시 토큰의 만료까지 24시간 이하 남았다면 새로 발급
      if (timeUntilExpiry <= 24 * 60 * 60) {
        newRefreshToken = this.jwtService.sign(
          { sub: userId },
          { expiresIn: '7d' }, // 예: 7일 유효
        );

        // 새 리프레시 토큰을 Redis에 저장
        await this.redis.set(
          `refreshToken:${userId}`,
          newRefreshToken,
          'EX',
          7 * 24 * 60 * 60,
        );
      }

      // 새 액세스 토큰을 Redis에 저장 (예: 1시간 유효)
      await this.redis.set(
        `accessToken:${userId}`,
        newAccessToken,
        'EX',
        60 * 60,
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getRefreshToken(userId: number): Promise<string | null> {
    return this.redis.get(`refreshToken:${userId}`);
  }
}
