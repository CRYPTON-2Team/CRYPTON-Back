import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateNotificationDto {
  @ApiProperty({
    description: '읽음 여부',
    required: true,
    example: true,
  })
  @IsBoolean()
  isRead: boolean;
}
