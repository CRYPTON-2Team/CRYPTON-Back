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
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: configValidationSchema,
      isGlobal: true,
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
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
