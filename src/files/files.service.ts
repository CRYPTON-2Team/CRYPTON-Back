import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3ServiceException,
  NoSuchKey,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { File } from './entities/file.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CompleteUploadDto } from './dto/upload.dto';

export interface UploadObject {
  signedUrl: Promise<string>;
  metadataId: string;
  s3Key: string;
}

@Injectable()
export class FileService {
  private s3Client: S3Client;
  private readonly encryptionKey: Buffer;
  @InjectRepository(File)
  private fileRepository: Repository<File>;
  @InjectRepository(User)
  private userRepository: Repository<User>;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new Error('유효하지 않은 암호화 키입니다. 반드시 64자여야 합니다.');
    }
    this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    if (this.encryptionKey.length !== 32) {
      throw new Error('유효하지 않은 암호화 키입니다. 반드시 32자여야 합니다.');
    }
  }

  /** 업로드 url 발급 */
  async getUploadPresignedUrl(
    key: string,
    contentType: string,
  ): Promise<UploadObject> {
    try {
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

      return {
        signedUrl: getSignedUrl(this.s3Client, command, {
          expiresIn: 3600,
        }),
        metadataId: uniqueId,
        s3Key,
      };
    } catch (err) {
      if (err instanceof S3ServiceException) {
        throw new HttpException(
          'S3 서비스 오류',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      } else {
        throw new HttpException(
          '파일 업로드 중 문제 발생',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
  // 업로드된 파일의 정보 저장
  async saveFileInfo(userId: number, completeUploadDto: CompleteUploadDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${completeUploadDto.s3Key}`;
    try {
      const fileInfo = this.fileRepository.create({
        userId,
        s3Url,
        ...completeUploadDto,
      });

      return await this.fileRepository.save(fileInfo);
    } catch (err) {
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      });

      const { Body } = await this.s3Client.send(command);
      if (!Body || !(Body instanceof Readable)) {
        throw new Error('파일을 찾을 수 없거나 읽을 수 없습니다');
      }
      const ivChunk = await new Promise<Buffer>((resolve) => {
        Body.once('readable', () => {
          const iv = Body.read(16);
          resolve(iv);
        });
      });

      if (!ivChunk || ivChunk.length !== 16) {
        throw new Error('유효하지 않은 파일 암호화 포맷입니다.');
      }

      const decipherStream = this.createDecryptStream(ivChunk);
      return Body.pipe(decipherStream);
    } catch (error) {
      if (error instanceof NoSuchKey) {
        throw new NotFoundException(
          `키 ${key}에 해당하는 파일을 찾을 수 없습니다`,
        );
      } else if (error instanceof S3ServiceException) {
        throw new HttpException(
          'S3 서비스 오류',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      } else {
        throw new HttpException(
          '파일 다운로드 중 오류 발생',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async decodeFileName(str: string): Promise<string> {
    const decodeQEncoding = (encoded: string): string => {
      return decodeURIComponent(encoded.replace(/=/g, '%').replace(/_/g, ' '));
    };

    const decodeBEncoding = (encoded: string): string => {
      return Buffer.from(encoded, 'base64').toString('utf-8');
    };

    try {
      // 여러 번 인코딩된 경우를 처리
      while (str.includes('=?')) {
        str = str.replace(
          /=\?(UTF-8|ISO-8859-1)\?(Q|B)\?(.*?)\?=/gi,
          (match, charset, encoding, encodedText) => {
            if (encoding.toUpperCase() === 'Q') {
              return decodeQEncoding(encodedText);
            } else if (encoding.toUpperCase() === 'B') {
              return decodeBEncoding(encodedText);
            }
            return match;
          },
        );
      }

      str = decodeURIComponent(str);

      return str;
    } catch (e) {
      console.error('Decoding failed:', e);
      // 부분적으로 디코딩된 결과라도 반환
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
      if (error instanceof NoSuchKey) {
        throw new NotFoundException(
          `키 ${key}에 해당하는 파일을 찾을 수 없습니다`,
        );
      } else if (error instanceof S3ServiceException) {
        throw new HttpException(
          'S3 서비스 오류',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      } else {
        throw new HttpException(
          '파일 정보 조회 중 오류 발생',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
