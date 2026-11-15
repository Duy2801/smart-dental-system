import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/curent-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { StaffRoleCode, UserQueryDto } from './dto/user-query.dto';
import {
  STAFF_DOCUMENT_MAX_BYTES,
  UserService,
  type StaffDocumentFile,
} from './user.service';

@ApiTags('User')
@ApiBearerAuth()
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['users', 'admin/users'])
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(@Query() query: UserQueryDto) {
    return this.userService.findAll(query);
  }

  @Get('staff')
  findStaff(@Query() query: UserQueryDto) {
    return this.userService.findStaff(query);
  }

  @Post('admin')
  createAdmin(@Body() dto: CreateStaffUserDto) {
    return this.userService.createStaffUser(dto, StaffRoleCode.ADMIN);
  }

  @Post('receptionist')
  createReceptionist(@Body() dto: CreateStaffUserDto) {
    return this.userService.createStaffUser(dto, StaffRoleCode.RECEPTIONIST);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    if (id === user.userId && dto.roleCode && dto.roleCode !== StaffRoleCode.ADMIN) {
      throw new BadRequestException('user.cannot_demote_self');
    }
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (id === user.userId) {
      throw new BadRequestException('user.cannot_deactivate_self');
    }
    return this.userService.remove(id);
  }

  @Get(':id/documents')
  listDocuments(@Param('id') id: string) {
    return this.userService.listDocuments(id);
  }

  @Post(':id/documents')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: STAFF_DOCUMENT_MAX_BYTES },
    }),
  )
  uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile() file: StaffDocumentFile | undefined,
  ) {
    return this.userService.uploadDocument(id, file, user.userId);
  }

  @Delete(':id/documents/:documentId')
  removeDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.userService.removeDocument(id, documentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}

