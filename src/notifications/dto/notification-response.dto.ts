import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsBoolean } from 'class-validator';
import { NotificationType } from '../../common/types/notification-types.enum';

export class NotificationResponse {
  @ApiProperty({
    description: '알림 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '사용자 ID',
    example: 100,
  })
  userId: number;

  @ApiProperty({
    description: '알림 타입',
    enum: NotificationType,
    example: NotificationType.FILE_REQUEST_RECEIVED,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: '알림 메시지',
    example: '새로운 파일 요청이 도착했습니다.',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: '읽음 여부',
    example: false,
  })
  @IsBoolean()
  isRead: boolean;

  @ApiProperty({
    description: '생성 일시',
    example: '2023-08-10T09:00:00Z',
  })
  createdAt: Date;
}
