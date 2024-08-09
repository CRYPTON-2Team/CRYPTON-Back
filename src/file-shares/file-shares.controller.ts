import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileShareService } from './file-shares.service';
import { CreateFileShareDto } from './dto/create-file-share.dto';
import { AccessFileShareDto } from './dto/access-key.dto';

@Controller('file-share')
export class FileShareController {
  constructor(private readonly fileShareService: FileShareService) {}

  // 파일 공유하기 - 공유 링크 생성 후 이메일 발송
  // TODO: rate limiting, Retry

  @Post()
  // @UserGuards(JwtAuthGuard)
  async createFileShareLink(
    // @GetUser() user: User,
    @Body() createFileShareDto: CreateFileShareDto,
  ) {
    const userId = 1;
    const result = await this.fileShareService.createFileShareLink(
      userId,
      createFileShareDto,
    );
    const shareUrl = `http://localhost:3000/file-share/link/?token=${result.token}`;

    return {
      shareUrl,
      expiredAt: result.expiredAt,
      fileId: result.fileId,
      fileOwnerId: result.fileOwnerId,
      accessKey: result.accessKey,
    };
  }

  // 공유 링크로 파일 열람 - 공유 링크로 접속 후 암호키를 입력 -> 검증 -> 파일 열람
  @Post('link')
  async accessFileShare(
    @Query('token') token: string,
    @Body() accessFileShareDto: AccessFileShareDto,
  ) {
    try {
      const fileShareInfo = await this.fileShareService.verifyFileShare(
        token,
        accessFileShareDto.accessKey,
      );
      return {
        message: '파일 공유 접근이 승인되었습니다.',
        fileShareInfo,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      }
      throw new InternalServerErrorException(
        '파일 공유 접근 중 오류가 발생했습니다.',
      );
    }
  }
}
