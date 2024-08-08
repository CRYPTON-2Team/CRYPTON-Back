import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileService } from './files.service';
import { FileController } from './files.controller';

@Module({
  imports: [ConfigModule],
  providers: [FileService],
  exports: [FileService],
  controllers: [FileController],
})
export class FilesModule {}
