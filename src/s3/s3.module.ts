import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './s3.service';
import { UploadController } from './s3.controller';

@Module({
  imports: [ConfigModule],
  providers: [S3Service],
  exports: [S3Service],
  controllers: [UploadController],
})
export class S3Module {}
