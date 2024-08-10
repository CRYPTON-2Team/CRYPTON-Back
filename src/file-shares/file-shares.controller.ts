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
  UseGuards,
} from '@nestjs/common';
import { FileShareService } from './file-shares.service';
import { CreateFileShareDto } from './dto/create-file-share.dto';
import { AccessFileShareDto } from './dto/access-key.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../auth/decorator/user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/users/entities/user.entity';

@ApiTags('file-share')
@Controller('file-share')
export class FileShareController {
  constructor(private readonly fileShareService: FileShareService) {}

  // TODO: rate limiting, Retry

  @Post()
  @ApiOperation({ summary: '파일 공유하기 - 공유 링크 생성 후 이메일 발송' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: '파일 공유 링크가 생성되었습니다.' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiBody({ type: CreateFileShareDto })
  async createFileShareLink(
    @GetUser() user: User,
    @Body() createFileShareDto: CreateFileShareDto,
  ) {
    const result = await this.fileShareService.createFileShareLink(
      user.id,
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

  @Post('link')
  @ApiOperation({
    summary:
      '공유 링크로 파일 열람 - 공유 링크로 접속 후 암호키를 입력 -> 검증 -> 파일 열람',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: '파일 공유 접근이 승인되었습니다.' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 404, description: '파일을 찾을 수 없습니다.' })
  @ApiQuery({ name: 'token', required: true, description: '공유 링크 토큰' })
  @ApiBody({ type: AccessFileShareDto })
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
