import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ShareLink } from './entities/share-link.entity';
import { File } from '../files/entities/file.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileShareService {
  constructor(
    @InjectRepository(ShareLink)
    private shareLinkRepository: Repository<ShareLink>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async createShareLink(
    fileId: number,
    creatorId: number,
    expiresIn: number,
  ): Promise<ShareLink> {
    const file = await this.fileRepository.findOne(fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const shareLink = this.shareLinkRepository.create({
      file,
      creator: { id: creatorId },
      token,
      expiresAt,
    });

    return this.shareLinkRepository.save(shareLink);
  }

  async sendShareLinkEmail(
    token: string,
    recipientEmail: string,
  ): Promise<void> {
    const shareLink = await this.shareLinkRepository.findOne({
      where: { token },
      relations: ['file'],
    });
    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    await this.emailQueue.add('sendShareLink', {
      to: recipientEmail,
      subject: 'File Share Link',
      text: `You have been shared a file: ${shareLink.file.name}. Access it here: ${process.env.APP_URL}/share/${shareLink.token}`,
    });
  }

  async getFileByShareLink(token: string): Promise<File> {
    const shareLink = await this.shareLinkRepository.findOne({
      where: { token },
      relations: ['file'],
    });

    if (!shareLink || shareLink.expiresAt < new Date()) {
      throw new NotFoundException('Invalid or expired share link');
    }

    return shareLink.file;
  }
}
