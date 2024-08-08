import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SendFileShareEmailDto } from 'src/file-shares/dto/send-file-share-email.dto';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  async sendEmail(sendEmailDto: SendFileShareEmailDto): Promise<void> {
    await this.emailQueue.add('sendEmail', sendEmailDto, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
