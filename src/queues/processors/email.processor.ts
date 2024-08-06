import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @Inject('NODEMAILER_TRANSPORTER')
    private transporter: nodemailer.Transporter,
    private configService: ConfigService,
  ) {}

  @Process('sendShareLink')
  async handleSendShareLink(job: Job) {
    this.logger.debug('Start sending share link email...');
    const { to, subject, text } = job.data;

    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to,
        subject,
        text,
      });
      this.logger.debug('Share link email sent successfully');
    } catch (error) {
      this.logger.error('Failed to send share link email', error.stack);
      throw error;
    }
  }
}
