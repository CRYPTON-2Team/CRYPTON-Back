import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('/:userId')
  async getUnreadNotifications(@Param('userId') userId: number) {
    return this.notificationsService.findUnreadByUserId(userId);
  }

  @Patch('/:id/read')
  async markAsRead(@Param('id') id: number) {
    await this.notificationsService.markAsRead(id);
    return { success: true };
  }
}
