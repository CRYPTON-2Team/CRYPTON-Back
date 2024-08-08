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
import { encode } from 'punycode';

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
    console.log(decodedFileName);
    const safeFileName = encodeURIComponent(decodedFileName);
    console.log('a:', safeFileName);
    const uniqueId = uuidv4();
    const timestamp = Date.now();

    const s3Key = `${timestamp}-${uniqueId}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      ContentType: contentType,
      // ContentEncoding: 'utf-8',
      Metadata: {
        'original-name': decodedFileName,
        'unique-id': uniqueId,
      },
    });

    console.log('Generating presigned URL for:', s3Key);

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

    // 첫 16바이트를 읽어 IV를 추출합니다.
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

    // Body 스트림에서 나머지 데이터를 decipherStream으로 파이프합니다.
    return Body.pipe(decipherStream);
  }

  async getOriginalFileName(key: string): Promise<string> {
    try {
      const command = new HeadObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      });

      const headObject = await this.s3Client.send(command);
      const originalFileName = headObject.Metadata?.['original-name'];
      console.log('a:', originalFileName);

      if (originalFileName) {
        return decodeURIComponent(originalFileName);
      } else {
        return key.split('/').pop() || 'unknown';
      }
    } catch (error) {
      console.error('Error getting original file name:', error);
      return 'unknown';
    }
  }
}
