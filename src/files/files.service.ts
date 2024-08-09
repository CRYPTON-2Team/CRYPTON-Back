import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileService {
  private s3Client: S3Client;
  private readonly encryptionKey: Buffer;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }

  /** 업로드 url 발급 */
  async getUploadPresignedUrl(
    key: string,
    contentType: string,
  ): Promise<string> {
    const buffer = Buffer.from(key, 'binary');
    const decodedFileName = buffer.toString('utf8');
    const safeFileName = encodeURIComponent(decodedFileName);
    const uniqueId = uuidv4();
    const timestamp = Date.now();

    const s3Key = `${timestamp}-${uniqueId}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      ContentType: contentType,
      Metadata: {
        'original-name': decodedFileName,
        'unique-id': uniqueId,
      },
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });
  }
  encryptBuffer(buffer: Buffer): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    return Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
  }

  async getDownloadPresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  createDecryptStream(iv: Buffer): crypto.Decipher {
    return crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
  }

  async streamDownloadAndDecrypt(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    });

    const { Body } = await this.s3Client.send(command);
    if (!Body || !(Body instanceof Readable)) {
      throw new Error('File not found or not readable');
    }
    const ivChunk = await new Promise<Buffer>((resolve) => {
      Body.once('readable', () => {
        const iv = Body.read(16);
        resolve(iv);
      });
    });

    if (!ivChunk || ivChunk.length !== 16) {
      throw new Error('Invalid encrypted file format');
    }

    const decipherStream = this.createDecryptStream(ivChunk);
    return Body.pipe(decipherStream);
  }

  async decodeFileName(str: string): Promise<string> {
    try {
      if (str.startsWith('=?UTF-8?Q?')) {
        str = str.replace(/=\?UTF-8\?Q\?(.*?)\?=/gi, (match, p1) => {
          return decodeURIComponent(p1.replace(/=/g, '%').replace(/_/g, ' '));
        });
      }
    } catch (e) {
      console.error('Decoding failed:', e);
      return str;
    }
  }

  async getOriginalFileName(key: string): Promise<string> {
    try {
      const command = new HeadObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      });

      const headObject = await this.s3Client.send(command);
      const originalFileName = headObject.Metadata?.['original-name'];

      if (originalFileName) {
        return this.decodeFileName(originalFileName);
      } else {
        return key.split('/').pop() || 'unknown';
      }
    } catch (error) {
      console.error('파일 이름을 가져오는데 실패했습니다:', error);
      return 'unknown';
    }
  }
}
