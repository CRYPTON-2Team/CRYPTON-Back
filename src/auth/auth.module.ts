import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './jwt/local.strategy';
import { JwtStrategy } from './jwt/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { Redis } from 'ioredis';
import { RedisModule } from '../redis/redis.module';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Module({
  controllers: [AuthController],
  imports: [
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '60m' },
    }),
    PassportModule.register({ defaultStrategy: 'local' }),
    RedisModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, RefreshTokenGuard],
})
export class AuthModule {}
