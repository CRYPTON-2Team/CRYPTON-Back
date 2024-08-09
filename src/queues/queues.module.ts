import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProcessor } from './processors/email.processor';
import { EmailService } from './services/email.service';

@Module({
  imports: [
    ConfigModule,
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
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [
    EmailService,
    EmailProcessor,
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
  exports: [EmailService, BullModule],
})
export class QueuesModule {}
