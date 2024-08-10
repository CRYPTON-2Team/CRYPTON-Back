import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  Get,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { AccessRequestsService } from './access-requests.service';
import { UpdateAccessRequestDto } from './dto/update-access-request.dto';
import { User } from 'src/users/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorator/user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('access-requests')
@Controller('files/:fileId/access-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AccessRequestsController {
  constructor(private readonly accessRequestsService: AccessRequestsService) {}

  @Get()
  @ApiOperation({ summary: '파일에 대한 모든 접근 요청 조회' })
  @ApiParam({ name: 'fileId', type: 'number', description: '파일 ID' })
  @ApiResponse({ status: 200, description: '접근 요청 목록 조회 성공' })
  async findAllAccessRequestsByFileId(
    @GetUser() user: User,
    @Param('fileId') fileId: number,
  ) {
    return await this.accessRequestsService.findAllAccessRequestsByFileId(
      user.id,
      fileId,
    );
  }

  @Get('/:id')
  @ApiOperation({ summary: '특정 접근 요청 조회' })
  @ApiParam({ name: 'fileId', type: 'number', description: '파일 ID' })
  @ApiParam({ name: 'id', type: 'number', description: '접근 요청 ID' })
  @ApiResponse({ status: 200, description: '접근 요청 조회 성공' })
  @ApiResponse({ status: 404, description: '접근 요청을 찾을 수 없음' })
  async findAccessRequestById(
    @GetUser() user: User,
    @Param('fileId') fileId: number,
    @Param('id') id: number,
  ) {
    return await this.accessRequestsService.findAccessRequestById(
      user.id,
      fileId,
      id,
    );
  }

  @Post()
  @ApiOperation({ summary: '새로운 접근 요청 생성' })
  @ApiParam({ name: 'fileId', type: 'number', description: '파일 ID' })
  @ApiResponse({ status: 201, description: '접근 요청 생성 성공' })
  async createAccessRequest(
    @GetUser() user: User,
    @Param('fileId') fileId: number,
  ) {
    return await this.accessRequestsService.createAccessRequest(
      user.id,
      fileId,
    );
  }

  @Put('/:id')
  @ApiOperation({ summary: '접근 요청 상태 업데이트' })
  @ApiParam({ name: 'fileId', type: 'number', description: '파일 ID' })
  @ApiParam({ name: 'id', type: 'number', description: '접근 요청 ID' })
  @ApiBody({ type: UpdateAccessRequestDto })
  @ApiResponse({ status: 200, description: '접근 요청 업데이트 성공' })
  @ApiResponse({ status: 404, description: '접근 요청을 찾을 수 없음' })
  async updateAccessRequest(
    @GetUser() user: User,
    @Param('fileId') fileId: number,
    @Param('id') id: number,
    @Body() updateAccessRequestDto: UpdateAccessRequestDto,
  ) {
    return await this.accessRequestsService.updateAccessRequest(
      user.id,
      fileId,
      id,
      updateAccessRequestDto,
    );
  }

  @Delete('/:id')
  @ApiOperation({ summary: '접근 요청 취소' })
  @ApiParam({ name: 'fileId', type: 'number', description: '파일 ID' })
  @ApiParam({ name: 'id', type: 'number', description: '접근 요청 ID' })
  @ApiResponse({ status: 200, description: '접근 요청 취소 성공' })
  @ApiResponse({ status: 404, description: '접근 요청을 찾을 수 없음' })
  async cancelAccessRequest(
    @GetUser() user: User,
    @Param('fileId') fileId: number,
    @Param('id') id: number,
  ) {
    return await this.accessRequestsService.cancelAccessRequest(
      user.id,
      fileId,
      id,
    );
  }
}
