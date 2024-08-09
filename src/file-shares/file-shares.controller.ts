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

  // TODO: rate limiting

  /**
   * createFileShareLink: 파일 소유자가 파일 공유 링크를 생성한다.
   * sendFileShareEmails: 파일 공유 링크를 담아 이메일을 전송하는데, 이메일에는 공유링크와 함께 파일에 접근할 수 있는 암호키 AES256이 작성되어 있다.
   * getFileShareByToken: 생성된 공유링크를 받은 사람이 브라우저 주소창에 공유링크를 입력하여 접속한다.
   *
   * 접속하게된 페이지에서 사용자는 fileId로 저장된 파일의 정보를 확인한다.
   * 그 정보에는 파일명, 파일 크기, 파일 확장자, 유효 열람 기간(expiresAt)이 표시된다.
   * 암호키 입력란에 이메일에서 받았던 암호키를 입력하면, 서버는 Redis에 저장된 암호키와 대조하여 파일에 대한 접근 권한을 검증하고 부여한다.
   * '내 문서함에 저장'이라는 버튼을 누르면 -> 회원가입을 유도하고 로그인을 한다.
   * 파일 정보(shareWith)에 공유된 사용자들의 userId가 저장
   * '내 문서함'에서 방금 공유받은 파일 다운로드 버튼을 누른다.
   *
   *
   */

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
      userId: result.userId,
      accessKey: result.accessKey,
    };
  }

  @Post('link')
  async accessFileShare(
    @Query('token') token: string,
    @Body() accessFileShareDto: AccessFileShareDto,
  ) {
    try {
      const fileShareInfo = await this.fileShareService.verifyAndGetFileShare(
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
