import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../decorators/user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@User() user) {
    return this.usersService.findOne(user.id);
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put('profile')
  @UseInterceptors(FileInterceptor('profileImage'))
  async updateProfile(
    @User() user,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() profileImage: Express.Multer.File,
  ) {
    return this.usersService.update(user.id, updateUserDto, profileImage);
  }
}
