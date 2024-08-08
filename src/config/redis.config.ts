import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const redisConfig = {
  provide: 'REDIS_CLIENT',
  useFactory: (configService: ConfigService) => {
    return new Redis({
      host: configService.get('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
    });
  },
  inject: [ConfigService],
};