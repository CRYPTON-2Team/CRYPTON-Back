import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { NotificationType } from 'src/common/types/notification-types.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  async sendNotification(
    userId: number,
    type: NotificationType,
    message: string,
  ) {
    await this.notificationsQueue.add(
      'create-notification',
      {
        userId,
        type,
        message,
      },
      { attempts: 3 },
    );
  }
}
