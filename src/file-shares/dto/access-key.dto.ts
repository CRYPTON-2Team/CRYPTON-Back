import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AccessFileShareDto {
  @ApiProperty({
    description: '파일 공유 접근을 위한 암호키',
    example: 'abc123',
  })
  @IsString()
  @IsNotEmpty()
  accessKey: string;
}
