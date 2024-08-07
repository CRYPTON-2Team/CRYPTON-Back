import { Injectable, NotFoundException, UnauthorizedException, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { File } from 'src/files/entities/file.entity';
import { FileShare } from './entities/file-share.entity';
import { AccessRequest } from '../access-requests/entities/access-request.entity';
import { v4 as uuidv4 } from 'uuid';
import { CreateFileShareDto } from './dto/create-file-share.dto';
import { SendFileShareEmailDto } from './dto/send-file-share-email.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as crypto from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class FileShareService {
  constructor(
    @InjectRepository(FileShare)
    private fileShareRepository: Repository<FileShare>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AccessRequest)
    private accessRequestRepository: Repository<AccessRequest>,
    @InjectQueue('email') private emailQueue: Queue, 
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis
  ) {}

  async createFileShareLink(
    userId: number,
    createFileShareDto: CreateFileShareDto,
  ): Promise<FileShare> {
    const { fileId, expiresInHours = 24, recipientEmails } = createFileShareDto;

    const file = await this.fileRepository.findOne({ where: { id: fileId, userId } });
    if (!file) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const accessKey = crypto.randomBytes(32).toString('hex');

    const fileShare = this.fileShareRepository.create({
      userId: 1, //createFileShareDto.userId,
      fileId,
      token,
      createdAt: new Date(),
      expiredAt: expiresAt,
    });

    const savedFileShare = await this.fileShareRepository.save(fileShare);

    // Redis에 저장
    await this.redisClient.set(`fileShare:${token}:accessKey`, accessKey, 'EX', expiresInHours * 60 * 60);

    // 접근 권한 생성

    for (const email of recipientEmails) {
      const accessRequest = this.accessRequestRepository.create({
        fileId,
        fileOwnerId: userId,
        recipientEmail: email,
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
        encryptedKey: accessKey,
      });

      await this.accessRequestRepository.save(accessRequest);
    }

    // 모든 수신자에게 메일 전송
    await this.sendFileShareEmails({
      token,
      recipientEmails
    });
    
    return savedFileShare;
  }


  async getFileShareByToken(token: string): Promise<FileShare> {
    const fileShare = await this.fileShareRepository.findOne({
      where: { token },
      relations: ['file'],
    });
    if (!fileShare) {
      throw new NotFoundException('파일 링크를 찾을 수 없습니다.');
    }
    if (fileShare.expiredAt < new Date()) {
      throw new NotFoundException('링크의 유효기간이 만료되었습니다.');
    }
    return fileShare;
  }

  async verifyAccessKey(token: string, accessKey: string): Promise<boolean> {
    const storedAccessKey = await this.redisClient.get(`fileShare:${token}:accessKey`);
    if (!storedAccessKey) {
      throw new NotFoundException('암호 키를 찾을 수 없습니다.');
    }
    if (storedAccessKey !== accessKey) {
      throw new UnauthorizedException('유효하지 않은 암호 키입니다');
    }
    return true;
  }
  
  async sendFileShareEmails(
    sendFileShareEmailDto: SendFileShareEmailDto,
  ): Promise<void> {
    const { token, recipientEmails } = sendFileShareEmailDto;

    const fileShare = await this.getFileShareByToken(token);
    const accessKey = await this.redisClient.get(`fileShare:${token}:accessKey`);

    const shareUrl = `http://localhost:3000/file-share/link/${token}`;
    const subject = '[공유] 크립톤 파일 공유]';
    const html = `
      <p>파일 공유 링크: <a href="${shareUrl}">here</a>.</p>
      <p>파일명: ${fileShare.file.name}</p>
      <p>크기: ${fileShare.file.size} bytes</p>
      <p>파일 형식: ${fileShare.file.ext}</p>
      <p>암호 키: ${accessKey}</p>
      <p>유효기간: ${fileShare.expiredAt}</p>
    `;

    for (const email of recipientEmails) {
      await this.emailQueue.add('sendEmail', {
        to: email,
        subject,
        html,
      });
    }
  }
}