import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsInt, Min, Max, IsArray, IsEmail } from 'class-validator';

export class CreateFileShareDto {
  @ApiProperty({
    description: '공유할 파일의 ID',
    example: 1,
  })
  @IsNumber()
  fileId: number;

  @ApiProperty({
    description: '파일 공유 링크의 유효 시간 (시간 단위)',
    minimum: 1,
    maximum: 168,
    example: 24,
  })
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(168) // 최대 7일
  expiresInHours: number;

  @ApiProperty({
    description: '파일을 공유받을 사용자들의 이메일 주소 목록',
    example: ['user1@example.com', 'user2@example.com'],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  recipientEmails: string[];
}
