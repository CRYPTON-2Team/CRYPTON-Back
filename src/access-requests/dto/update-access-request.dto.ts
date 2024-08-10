import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAccessRequestDto {
  @ApiProperty({
    description: '접근 요청의 상태',
    enum: ['approved', 'rejected'],
    example: 'approved',
  })
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';
}
