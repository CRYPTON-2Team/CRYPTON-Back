import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(userId: number, type: string, message: string) {
    const notification = this.notificationsRepository.create({
      userId,
      type,
      message,
    });
    return this.notificationsRepository.save(notification);
  }

  async findUnreadByUserId(userId: number) {
    return this.notificationsRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number) {
    await this.notificationsRepository.update(id, { isRead: true });
  }
}
