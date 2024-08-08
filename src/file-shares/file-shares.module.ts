import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileShareService } from './file-shares.service';
import { FileShareController } from './file-shares.controller';
import { User } from 'src/users/entities/user.entity';
import { File } from 'src/files/entities/file.entity';
import { FileShare } from './entities/file-share.entity';
import { AccessRequest } from 'src/access-requests/entities/access-request.entity';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { redisConfig } from 'src/config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([FileShare, File, AccessRequest, User]),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [FileShareService, redisConfig],
  controllers: [FileShareController],
  exports: [FileShareService],
})
export class FileShareModule {}
