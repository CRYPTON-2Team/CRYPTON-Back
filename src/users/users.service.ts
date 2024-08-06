import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { S3Service } from '../s3/s3.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private s3Service: S3Service,
  ) {}

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    profileImage?: Express.Multer.File,
  ): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);

    if (profileImage) {
      const { key } = await this.s3Service.uploadFile(
        profileImage.buffer,
        `profile-${id}-${profileImage.originalname}`,
      );
      user.profileImageUrl = this.s3Service.getPublicUrl(key);
    }

    return this.usersRepository.save(user);
  }
}
