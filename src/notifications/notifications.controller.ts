import { Controller, Get, Param, Patch, UseGuards, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorator/user.decorator';
import { User } from '../users/entities/user.entity';
import { NotificationResponse } from './dto/notification-response.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '현재 사용자의 읽지 않은 알림 조회' })
  @ApiResponse({
    status: 200,
    description: '읽지 않은 알림 목록 조회 성공',
    type: [NotificationResponse],
  })
  async getUnreadNotifications(
    @GetUser() user: User,
  ): Promise<NotificationResponse[]> {
    return this.notificationsService.findUnreadByUserId(user.id);
  }

  @Patch('/:id')
  @ApiOperation({ summary: '알림을 읽음 상태로 표시' })
  @ApiParam({ name: 'id', type: 'number', description: '알림 ID' })
  @ApiResponse({
    status: 200,
    description: '알림 상태 업데이트 성공',
    type: NotificationResponse,
  })
  @ApiResponse({ status: 404, description: '알림을 찾을 수 없음' })
  async markAsRead(
    @GetUser() user: User,
    @Param('id') id: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ): Promise<NotificationResponse> {
    return this.notificationsService.markAsRead(user.id, id);
  }
}
