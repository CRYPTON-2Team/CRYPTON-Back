import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from '../common/types/notification-types.enum';
import { NotificationResponse } from './dto/notification-response.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(
    userId: number,
    type: NotificationType,
    message: string,
  ): Promise<NotificationResponse> {
    const notification = this.notificationsRepository.create({
      userId,
      type,
      message,
    });
    const savedNotification =
      await this.notificationsRepository.save(notification);
    return this.mapToResponse(savedNotification);
  }

  async findUnreadByUserId(userId: number): Promise<NotificationResponse[]> {
    const notifications = await this.notificationsRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
    return notifications.map(this.mapToResponse);
  }

  async markAsRead(userId: number, id: number): Promise<NotificationResponse> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException(`해당 알림이 존재하지 않습니다.`);
    }
    notification.isRead = true;
    const updatedNotification =
      await this.notificationsRepository.save(notification);
    return this.mapToResponse(updatedNotification);
  }

  private mapToResponse(notification: Notification): NotificationResponse {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type as NotificationType,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }
}
