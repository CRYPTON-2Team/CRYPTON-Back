import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  UseGuards,
  Req,
  Body,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './files.service';
import { Request, Response } from 'express';
import internal from 'stream';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { GetUser } from '../auth/decorator/user.decorator';
import { CompleteUploadDto } from './dto/upload.dto';

@ApiTags('file')
@Controller('file')
export class FileController {
  private readonly logger = new Logger(FileController.name);

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
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 100, // 10MB 제한
      },
    }),
  )
  @UseGuards(JwtAuthGuard)
  async encryptFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    try {
      this.logger.log(`File upload attempt: ${file.originalname}`);
      const encryptedBuffer = this.fileService.encryptBuffer(file.buffer);
      const key = file.originalname;
      const uploadUrl = await this.fileService.getUploadPresignedUrl(
        key,
        file.mimetype,
      );

      return {
        success: true,
        data: {
          uploadUrl,
          key,
          encryptedBuffer: encryptedBuffer.toString('base64'),
        },
        message: '파일 업로드 URL이 생성되었습니다.',
      };
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`, error.stack);
      throw new HttpException(
        '파일 업로드 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('download/:key')
  @ApiOperation({ summary: '파일 다운로드 및 복호화' })
  @ApiParam({ name: 'key', type: 'string', description: '파일 키' })
  @ApiResponse({ status: 200, description: '파일 다운로드 성공' })
  @ApiResponse({ status: 404, description: '파일을 찾을 수 없음' })
  @UseGuards(JwtAuthGuard)
  async downloadFile(@Param('key') key: string, @Res() res: Response) {
    try {
      this.logger.log(`File download attempt: ${key}`);
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
    } catch (error) {
      this.logger.error(`파일 다운로드 실패: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '파일 다운로드 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('complete-upload')
  @ApiOperation({ summary: '파일 업로드 완료 알림' })
  @ApiBody({ type: CompleteUploadDto })
  @ApiResponse({ status: 200, description: '파일 업로드 정보 저장 성공' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async completeUpload(
    @Body() completeUploadDto: CompleteUploadDto,
    @GetUser() user: User,
  ) {
    try {
      this.logger.log(`Complete upload attempt for user: ${user.id}`);
      const userId = user.id;
      const fileInfo = await this.fileService.saveFileInfo(
        userId,
        completeUploadDto,
      );

      return {
        success: true,
        data: { fileInfo },
        message: '정상적으로 업로드 되었습니다.',
      };
    } catch (error) {
      this.logger.error(
        `업로드에 실패했습니다.: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        '파일 정보 저장 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
