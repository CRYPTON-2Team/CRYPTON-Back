// file.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './files.service';
import { Response } from 'express';
import internal from 'stream';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async encryptFile(@UploadedFile() file: Express.Multer.File) {
    const encryptedBuffer = this.fileService.encryptBuffer(file.buffer);
    const key = file.originalname;
    const uploadUrl = await this.fileService.getUploadPresignedUrl(
      key,
      file.mimetype,
    );
    return {
      uploadUrl,
      key,
      encryptedBuffer: encryptedBuffer.toString('base64'),
    };
  }

  @Get('download/:key')
  async downloadFile(@Param('key') key: string, @Res() res: Response) {
    const fileStream: internal.Readable =
      await this.fileService.streamDownloadAndDecrypt(key);
    const originalFileName = await this.fileService.getOriginalFileName(key);
    const encodedFileName = encodeURIComponent(originalFileName);

    console.log('Original File Name:', originalFileName);
    console.log('Encoded File Name:', encodedFileName);

    // X-Original-Filename 헤더 설정 (URL 인코딩 사용)
    res.setHeader('X-Original-Filename', encodedFileName);

    // Content-Disposition 헤더 설정
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedFileName}`,
    );
    res.setHeader('Content-Type', 'application/octet-stream');

    fileStream.pipe(res);
  }
}
