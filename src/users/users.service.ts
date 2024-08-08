import {
  ConflictException,
  HttpCode,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { register } from 'module';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOneByUserName(username: string): Promise<User | undefined> {
    try {
      const user = await this.usersRepository.findOne({ where: { username } });
      if (!user) {
        throw new NotFoundException(`${username} 유저가 존재하지 않습니다.`);
      }
      return user;
    } catch (err) {
      throw new HttpException(
        `${username}님에 대한 정보를 가져오던 도중 문제가 발생했습니다. 다시 시도해주세요.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await this.usersRepository.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundException(`${email}은 존재하지 않습니다.`);
      }
      return user;
    } catch (err) {
      throw new HttpException(
        `${email}에 대한 정보를 가져오던 도중 문제가 발생했습니다. 다시 시도해주세요.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findUserById(id: number): Promise<User | undefined> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      return user;
    } catch (err) {
      throw new HttpException(
        `서버에 문제가 발생하였습니다. 다시 시도해주세요.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async createUser(registerDto: RegisterDto): Promise<User> {
    try {
      const { profileImgUrl, ...userData } = registerDto;
      const user = this.usersRepository.create({
        ...userData,
        ...(profileImgUrl && { profileImgUrl }),
      });
      return await this.usersRepository.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Username or email already exists');
      }
      throw new InternalServerErrorException(
        '계정 생성 도중 문제가 발생했습니다. 다시 시도해주세요.',
      );
    }
  }
}
