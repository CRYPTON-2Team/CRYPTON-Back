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

@Controller('files/:fileId/access-requests')
// @UseGuards(JwtAuthGuard)
export class AccessRequestsController {
  constructor(private readonly accessRequestsService: AccessRequestsService) {}

  @Get()
  findAllAccessRequestsByFileId(
    //@GetUser() user: User,
    @Param('fileId') fileId: number,
  ) {
    const userId = 1;
    return this.accessRequestsService.findAllAccessRequestsByFileId(
      userId,
      fileId,
    );
  }

  @Get('/:id')
  findAccessRequestById(
    //@GetUser() user: User,
    @Param('fileId') fileId: number,
    @Param('id') id: number,
  ) {
    const userId = 1;
    return this.accessRequestsService.findAccessRequestById(userId, fileId, id);
  }

  @Post()
  createAccessRequest(
    //@GetUser() user: User,
    @Param('fileId') fileId: number,
  ) {
    const userId = 1;
    return this.accessRequestsService.createAccessRequest(userId, fileId);
  }

  @Put('/:id')
  updateAccessRequest(
    //@GetUser() user: User,
    @Param('fileId') fileId: number,
    @Param('id') id: number,
    @Body() updateAccessRequestDto: UpdateAccessRequestDto,
  ) {
    const userId = 1;
    return this.accessRequestsService.updateAccessRequest(
      userId,
      fileId,
      id,
      updateAccessRequestDto,
    );
  }

  @Delete('/:id')
  cancelAccessRequest(
    //@GetUser() user: User,
    @Param('fileId') fileId: number,
    @Param('id') id: number,
  ) {
    const userId = 1;
    return this.accessRequestsService.cancelAccessRequest(userId, fileId, id);
  }
}
