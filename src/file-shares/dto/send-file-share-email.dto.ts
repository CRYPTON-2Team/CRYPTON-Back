import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class SendFileShareEmailDto {
  @ApiProperty({
    description: '이메일을 받을 수신자의 이메일 주소',
    example: 'user@example.com',
  })
  @IsString()
  @IsEmail({}, { each: true })
  to: string;

  @ApiProperty({
    description: '이메일 제목',
    example: '파일 공유 링크',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: '이메일 본문 (텍스트)',
    required: false,
    example: '첨부된 링크를 통해 공유된 파일에 접근하실 수 있습니다.',
  })
  @IsString()
  text?: string;

  @ApiProperty({
    description: '이메일 본문 (HTML)',
    required: false,
    example: '<p>첨부된 링크를 통해 공유된 파일에 접근하실 수 있습니다.</p>',
  })
  @IsString()
  html?: string;
}
