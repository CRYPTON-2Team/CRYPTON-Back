import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileShareService } from './file-share.service';
import { FileShareController } from './file-share.controller';
import { ShareLink } from './entities/share-link.entity';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShareLink, File]),
    BullModule.registerQueue({
      name: 'emailQueue',
    }),
  ],
  providers: [FileShareService],
  controllers: [FileShareController],
  exports: [FileShareService],
})
export class FileShareModule {}
