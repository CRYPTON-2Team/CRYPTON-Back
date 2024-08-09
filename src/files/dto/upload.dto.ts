import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CompleteUploadDto {
  @ApiProperty({ description: '파일의 S3 키' })
  @IsString()
  @IsNotEmpty()
  s3Key: string;

  @ApiProperty({ description: '파일 이름' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: '파일 크기' })
  @IsNumber()
  @IsNotEmpty()
  fileSize: number;

  @ApiProperty({ description: '파일 메타데이터' })
  @IsString()
  metadataId: string;

  @ApiProperty({ description: '파일 확장자' })
  @IsString()
  @IsNotEmpty()
  ext: string;

  @ApiProperty({ description: '파일 MIME 타입' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;
}
