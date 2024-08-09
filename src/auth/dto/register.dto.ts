import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: '사용자 이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({ example: 'johndoe', description: '사용자 이름' })
  @IsString()
  @MinLength(2, { message: '사용자 이름은 최소 2자 이상이어야 합니다.' })
  username: string;

  @ApiProperty({ example: 'password123', description: '비밀번호' })
  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/, {
    message:
      '비밀번호는 최소 6자 이상이며, 영문, 숫자, 특수문자를 모두 포함해야 합니다.',
  })
  password: string;

  @ApiProperty({
    required: false,
    example: 'https://example.com/profile.jpg',
    description: '프로필 이미지 URL, 아직 구현하지 않았습니다.',
  })
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이 아닙니다.' })
  profileImgUrl?: string;
}
