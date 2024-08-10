import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configValidationSchema } from './config/config.schema';
import { HealthModule } from './health/health.module';
import { QueuesModule } from './queues/queues.module';
import { BullModule } from '@nestjs/bull';
import { FileShareModule } from './file-shares/file-shares.module';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { AccessRequestsModule } from './access-requests/access-requests.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import Redis from 'ioredis';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: configValidationSchema,
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getTypeOrmConfig(configService),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: +configService.get<number>('REDIS_PORT'),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
      }),

      inject: [ConfigService],
    }),

    HealthModule,
    FilesModule,
    QueuesModule,
    FileShareModule,
    UsersModule,
    FilesModule,
    AccessRequestsModule,
    NotificationsModule,
    AuthModule,
    RedisModule,
  ],
  controllers: [],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          // 필요한 경우 추가 옵션 설정
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
