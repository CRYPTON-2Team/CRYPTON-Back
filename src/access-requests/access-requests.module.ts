import { Module } from '@nestjs/common';
import { AccessRequestsController } from './access-requests.controller';
import { AccessRequestsService } from './access-requests.service';
import { QueuesModule } from 'src/queues/queues.module';
import { redisConfig } from 'src/config/redis.config';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessRequest } from './entities/access-request.entity';
import { User } from 'src/users/entities/user.entity';
import { File } from 'src/files/entities/file.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([File, AccessRequest, User]),
    QueuesModule,
  ],
  providers: [AccessRequestsService, redisConfig],
  controllers: [AccessRequestsController],
})
export class AccessRequestsModule {}
