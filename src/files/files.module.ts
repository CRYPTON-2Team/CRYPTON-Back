import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileService } from './files.service';
import { FileController } from './files.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [ConfigModule, UsersModule, TypeOrmModule.forFeature([File, User])],
  providers: [FileService],
  exports: [FileService],
  controllers: [FileController],
})
export class FilesModule {}
