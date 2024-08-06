import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { FileShareService } from './file-share.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import {
  CreateShareLinkDto,
  SendShareLinkEmailDto,
} from './dto/file-share.dto';

@Controller('file-share')
export class FileShareController {
  constructor(private readonly fileShareService: FileShareService) {}

  // TODO: rate limiting

  @Post('link')
  @UseGuards(JwtAuthGuard)
  async createShareLink(
    @User() user,
    @Body() createLinkDto: CreateShareLinkDto,
  ) {
    const shareLink = await this.fileShareService.createShareLink(
      createLinkDto.fileId,
      user.id,
      createLinkDto.expiresIn,
    );
    return { token: shareLink.token };
  }

  @Post('send-email')
  @UseGuards(JwtAuthGuard)
  async sendShareLinkEmail(@Body() sendEmailDto: SendShareLinkEmailDto) {
    await this.fileShareService.sendShareLinkEmail(
      sendEmailDto.token,
      sendEmailDto.recipientEmail,
    );
    return { message: 'Share link email sent successfully' };
  }

  @Get(':token')
  async getSharedFile(@Param('token') token: string) {
    const file = await this.fileShareService.getFileByShareLink(token);
    return { file };
  }
}
