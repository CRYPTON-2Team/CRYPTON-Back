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

  @Process('sendEmail')
  async handleSendEmail(job: Job) {
    this.logger.debug('Start sending email...');
    const { to, subject, text, html } = job.data;

    try {
      await this.transporter.sendMail({
        from: this.configService.get('MAIL_ID'),
        to,
        subject,
        text,
        html,
      });
      this.logger.debug(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      throw error;
    }
  }
}
