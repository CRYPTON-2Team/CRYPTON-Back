import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from 'src/files/entities/file.entity';
import { FileShare } from './entities/file-share.entity';
import { v4 as uuidv4 } from 'uuid';
import { CreateFileShareDto } from './dto/create-file-share.dto';
import { EmailService } from 'src/queues/services/email.service';
import * as crypto from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class FileShareService {
  constructor(
    @InjectRepository(FileShare)
    private fileShareRepository: Repository<FileShare>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly emailService: EmailService,
  ) {}

  async createFileShareLink(
    userId: number,
    createFileShareDto: CreateFileShareDto,
  ) {
    const { fileId, expiresInHours = 24, recipientEmails } = createFileShareDto;

    const file = await this.fileRepository.findOne({
      where: { id: fileId, userId },
    });
    if (!file) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }

    const token = uuidv4();
    const expiredAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const accessKey = crypto.randomBytes(32).toString('hex');

    const fileShare = this.fileShareRepository.create({
      userId,
      fileId,
      token,
      createdAt: new Date(),
      expiredAt,
    });

    await this.fileShareRepository.save(fileShare);

    // Redis에 저장
    await this.redisClient.set(
      `fileShare:${token}:accessKey`,
      accessKey,
      'EX',
      expiresInHours * 60 * 60,
    );

    // 이메일 전송
    await this.sendFileShareEmails(
      token,
      file,
      accessKey,
      expiredAt,
      recipientEmails,
    );

    return {
      token: fileShare.token,
      expiredAt: fileShare.expiredAt,
      fileId: fileShare.fileId,
      userId,
      accessKey,
    };
  }

  private async sendFileShareEmails(
    token: string,
    file: File,
    accessKey: string,
    expiredAt: Date,
    recipientEmails: string[],
  ) {
    const shareUrl = `http://localhost:3000/file-share/link/${token}`;
    const subject = '[공유] 크립톤 파일 공유';
    const html = `
      <p>파일 공유 링크: <a href="${shareUrl}">${shareUrl}</a></p>
      <p>파일명: ${file.fileName}</p>
      <p>크기: ${file.fileSize} bytes</p>
      <p>파일 형식: ${file.ext}</p>
      <p>암호 키: ${accessKey}</p>
      <p>유효기간: ${expiredAt}</p>
    `;

    for (const email of recipientEmails) {
      await this.emailService.sendEmail({
        to: email,
        subject,
        html,
      });
    }
  }

  async verifyAndGetFileShare(token: string, accessKey: string) {
    const fileShare = await this.fileShareRepository.findOne({
      where: { token },
      relations: ['file'],
    });

    if (!fileShare) {
      throw new NotFoundException('파일 링크를 찾을 수 없습니다.');
    }

    if (fileShare.expiredAt < new Date()) {
      throw new UnauthorizedException('링크의 유효기간이 만료되었습니다.');
    }

    const storedAccessKey = await this.redisClient.get(
      `fileShare:${token}:accessKey`,
    );
    if (!storedAccessKey || storedAccessKey !== accessKey) {
      throw new UnauthorizedException('유효하지 않은 암호 키입니다.');
    }

    return {
      fileId: fileShare.fileId,
      fileName: fileShare.file.fileName,
      fileSize: fileShare.file.fileSize,
      fileType: fileShare.file.ext,
      expiredAt: fileShare.expiredAt,
    };
  }
}
