import { Processor, Process } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
@Processor('notifications')
export class NotificationProcessor {
  constructor(private notificationsService: NotificationsService) {}

  @Process('create-notification')
  async handleCreateNotification(job: Job) {
    const { userId, type, message } = job.data;
    await this.notificationsService.create(userId, type, message);
    console.log(
      `Notification created for user ${userId}: ${type} - ${message}`,
    );
  }
}
