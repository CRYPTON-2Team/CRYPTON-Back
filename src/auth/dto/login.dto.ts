import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, isEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: '사용자 이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({ example: 'password123', description: '비밀번호' })
  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;
}
