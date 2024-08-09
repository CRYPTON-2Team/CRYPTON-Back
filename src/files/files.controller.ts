import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './files.service';
import { Response } from 'express';
import internal from 'stream';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('file')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @ApiOperation({ summary: '파일 업로드 및 암호화' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '파일 업로드 성공' })
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
  @ApiOperation({ summary: '파일 다운로드 및 복호화' })
  @ApiParam({ name: 'key', type: 'string', description: '파일 키' })
  @ApiResponse({ status: 200, description: '파일 다운로드 성공' })
  @ApiResponse({ status: 404, description: '파일을 찾을 수 없음' })
  async downloadFile(@Param('key') key: string, @Res() res: Response) {
    const fileStream: internal.Readable =
      await this.fileService.streamDownloadAndDecrypt(key);
    const originalFileName = await this.fileService.getOriginalFileName(key);
    const encodedFileName = encodeURIComponent(originalFileName);

    res.setHeader('X-Original-Filename', encodedFileName);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedFileName}`,
    );
    res.setHeader('Content-Type', 'application/octet-stream');

    fileStream.pipe(res);
  }
}
