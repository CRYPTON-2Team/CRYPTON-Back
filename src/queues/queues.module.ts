import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProcessor } from './processors/email.processor';
import { EmailService } from './services/email.service';
import { NotificationService } from './services/notification.service';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    NotificationsModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'email' }, { name: 'notifications' }),
  ],
  providers: [
    EmailService,
    EmailProcessor,
    NotificationService,
    NotificationProcessor,

    {
      provide: 'NODEMAILER_TRANSPORTER',
      useFactory: async (configService: ConfigService) => {
        const nodemailer = require('nodemailer');
        return nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: configService.get('MAIL_ID'),
            pass: configService.get('MAIL_PASSWORD'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [EmailService, NotificationService, BullModule],
})
export class QueuesModule {}
