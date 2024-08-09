import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessRequest } from './entities/access-request.entity';
import { File } from '../files/entities/file.entity';
import { User } from '../users/entities/user.entity';
import { UpdateAccessRequestDto } from './dto/update-access-request.dto';
import { NotificationService } from 'src/queues/services/notification.service';
import { NotificationType } from 'src/common/types/notification-types.enum';
import { RedisKeys } from 'src/common/utils/redis-keys.util';
import Redis from 'ioredis';

@Injectable()
export class AccessRequestsService {
  constructor(
    @InjectRepository(AccessRequest)
    private accessRequestRepository: Repository<AccessRequest>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  async findAllAccessRequestsByFileId(userId: number, fileId: number) {
    await this.validateFileOwnership(fileId, userId);
    return this.accessRequestRepository.find({
      where: { fileId },
      relations: ['requester'],
    });
  }

  async findAccessRequestById(userId: number, fileId: number, id: number) {
    const accessRequest = await this.validateAccessRequest(
      id,
      userId,
      'permission',
    );

    if (accessRequest.fileId !== fileId) {
      throw new ForbiddenException(
        '해당 파일에 접근을 요청할 수 없습니다. 파일을 확인해주세요.',
      );
    }

    return accessRequest;
  }

  async createAccessRequest(userId: number, fileId: number) {
    const file = await this.fileRepository.findOne({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }

    if (file.fileOwnerId === userId) {
      throw new ForbiddenException(
        '내 파일에 대한 접근 요청은 할 수 없습니다.',
      );
    }

    const existingRequest = await this.accessRequestRepository.findOne({
      where: { fileId, requesterId: userId },
    });

    if (existingRequest) {
      throw new ForbiddenException('접근 요청이 이미 존재합니다.');
    }

    const newAccessRequest = this.accessRequestRepository.create({
      fileId,
      fileOwnerId: file.fileOwnerId,
      requesterId: userId,
      status: 'pending',
    });

    const savedRequest =
      await this.accessRequestRepository.save(newAccessRequest);

    // fileOwner에게 파일 요청 도착 알림 전송
    await this.notificationService.sendNotification(
      file.fileOwnerId,
      NotificationType.FILE_REQUEST_RECEIVED,
      `새로운 파일 접근 요청이 도착했습니다.`,
    );

    return savedRequest;
  }

  async updateAccessRequest(
    userId: number,
    fileId: number,
    id: number,
    updateAccessRequestDto: UpdateAccessRequestDto,
  ) {
    const accessRequest = await this.validateAccessRequest(
      id,
      userId,
      'ownership',
    );

    if (accessRequest.fileId !== fileId) {
      throw new ForbiddenException(
        '해당 파일에 접근을 요청할 수 없습니다. 파일을 확인해주세요.',
      );
    }

    Object.assign(accessRequest, updateAccessRequestDto);
    accessRequest.updatedAt = new Date();

    if (updateAccessRequestDto.status === 'approved') {
      const accessKey = await this.redisClient.get(
        RedisKeys.fileAccessKey(fileId),
      );

      if (!accessKey) {
        throw new NotFoundException(
          `파일 ${fileId}에 대한 암호 키를 찾을 수 없습니다.`,
        );
      }

      accessRequest.encryptedKey = accessKey;

      // requester에게 요청 승인 알림 전송
      await this.notificationService.sendNotification(
        accessRequest.requesterId,
        NotificationType.FILE_REQUEST_APPROVED,
        `${accessRequest.file.name} 파일에 대한 접근 요청이 승인되었습니다. 이제 파일에 접근할 수 있습니다.`,
      );
    } else if (updateAccessRequestDto.status === 'rejected') {
      accessRequest.encryptedKey = null;

      // requester에게 요청 거절 알림 전송
      await this.notificationService.sendNotification(
        accessRequest.requesterId,
        NotificationType.FILE_REQUEST_REJECTED,
        `${accessRequest.file.name} 파일에 대한 접근 요청이 거절되었습니다.`,
      );
    }

    return this.accessRequestRepository.save(accessRequest);
  }

  async cancelAccessRequest(userId: number, fileId: number, id: number) {
    const accessRequest = await this.validateAccessRequest(
      id,
      userId,
      'requester',
    );
    if (accessRequest.fileId !== fileId) {
      throw new ForbiddenException(
        '해당 파일에 접근을 요청할 수 없습니다. 파일을 확인해주세요.',
      );
    }
    await this.accessRequestRepository.remove(accessRequest);

    // fileOwner에게 파일 요청 취소 알림
    await this.notificationService.sendNotification(
      accessRequest.fileOwnerId,
      NotificationType.FILE_REQUEST_CANCELED,
      `파일 접근 요청이 취소되었습니다.`,
    );
  }

  /**
   * 검증 관련 함수
   */

  private async validateFileOwnership(fileId: number, userId: number) {
    const file = await this.fileRepository.findOne({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }
    if (file.fileOwnerId !== userId) {
      throw new ForbiddenException('이 파일에 접근할 권한이 없습니다.');
    }
    return file;
  }

  private async validateAccessRequest(
    id: number,
    userId: number,
    validationType: 'permission' | 'ownership' | 'requester',
  ): Promise<AccessRequest> {
    // permission 검증 시
    const relations = validationType === 'permission' ? ['file'] : [];

    const accessRequest = await this.accessRequestRepository.findOne({
      where: { id },
      relations,
    });

    if (!accessRequest) {
      throw new NotFoundException(
        '접근 권한이 존재하지 않습니다. 재요청해주세요.',
      );
    }

    switch (validationType) {
      case 'permission':
        if (
          accessRequest.fileOwnerId !== userId &&
          accessRequest.requesterId !== userId
        ) {
          throw new ForbiddenException(
            '해당 파일에 접근할 권한이 없습니다. 권한 요청이 필요합니다.',
          );
        }
        break;
      case 'ownership':
        if (accessRequest.fileOwnerId !== userId) {
          throw new ForbiddenException(
            '이 접근 요청을 업데이트할 권한이 없습니다.',
          );
        }
        break;
      case 'requester':
        if (accessRequest.requesterId !== userId) {
          throw new ForbiddenException(
            '이 접근 요청을 취소할 권한이 없습니다.',
          );
        }
        break;
    }

    return accessRequest;
  }
}
