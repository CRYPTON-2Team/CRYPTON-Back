import { Controller, Post, Body, Get, Param, UnauthorizedException, UseGuards } from '@nestjs/common';
import { FileShareService } from './file-shares.service';
import { CreateFileShareDto } from './dto/create-file-share.dto';
import { SendFileShareEmailDto } from './dto/send-file-share-email.dto';
import { VerifyAccessKeyDto } from './dto/verify-access-key.dto';

@Controller('file-share')
// @UserGuards(JwtAuthGuard)
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


  @Post('link')
  async createFileShareLink(
    @Body() createFileShareDto: CreateFileShareDto
  ) {
    const userId = 1;
    const fileShare = await this.fileShareService.createFileShareLink(userId, createFileShareDto);
    const shareUrl = `http://localhost:3000/file-share/link/${fileShare.token}`;
    return {
      shareUrl,
      expiresAt: fileShare.expiredAt,
      fileId: fileShare.fileId,
      userId: fileShare.userId,
    };
  }

  @Get('link/:token')
  async getFileShareByToken(@Param('token') token: string) {
    const fileShare = await this.fileShareService.getFileShareByToken(token);
    return {
      message: '유효한 파일 링크입니다.',
      fileId: fileShare.fileId,
      fileName: fileShare.file.name,
      fileSize: fileShare.file.size,
      fileType: fileShare.file.ext,
      expiresAt: fileShare.expiredAt,
    };
  }

  @Post('verify-access')
  async verifyAccessKey(@Body() verifyAccessKeyDto: VerifyAccessKeyDto) {
    const { token, accessKey } = verifyAccessKeyDto;
    try {
      await this.fileShareService.verifyAccessKey(token, accessKey);
      return { message: '접근 권한이 확인되었습니다.' };
    } catch (error) {
      throw new UnauthorizedException('잘못된 접근 키입니다.');
    }
  }
  
  @Post('send-emails')
  async sendFileShareEmails(
    @Body() sendFileShareEmailDto: SendFileShareEmailDto,
  ) {
    await this.fileShareService.sendFileShareEmails(sendFileShareEmailDto);
    return { message: '이메일이 성공적으로 전송되었습니다.' };
  }

}
