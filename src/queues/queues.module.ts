import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProcessor } from './processors/email.processor';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [
    EmailProcessor,
    {
      provide: 'NODEMAILER_TRANSPORTER',
      useFactory: async (configService: ConfigService) => {
        const nodemailer = require('nodemailer');
        return nodemailer.createTransport({
          host: configService.get('SMTP_HOST'),
          port: configService.get('SMTP_PORT'),
          secure: configService.get('SMTP_SECURE') === 'true',
          auth: {
            user: configService.get('SMTP_USER'),
            pass: configService.get('SMTP_PASS'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class QueuesModule {}
