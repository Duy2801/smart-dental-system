import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateDoctorDto } from './dto/create-doctor-dto';
import { UpdateDoctorDto } from './dto/update-doctor-dto';
import { DoctorService } from './doctor.service';

const toView = (view?: string) => (view === 'summary' ? 'summary' : 'full');

/**
 * API công khai cho web/app bệnh nhân: chỉ đọc, và chỉ trả các trường được phép
 * hiển thị (không có email, số điện thoại, tài khoản của bác sĩ hay bệnh nhân).
 */
@ApiTags('Doctor')
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  findAll(
    @Query('serviceId') serviceId?: string,
    @Query('specializationId') specializationId?: string,
    @Query('view') view?: string,
  ) {
    return this.doctorService.getAllDoctors(
      serviceId,
      specializationId,
      toView(view),
      'public',
    );
  }

  @Get('specializations')
  listSpecializations() {
    return this.doctorService.listSpecializationNames();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorService.getDoctorById(id, 'public');
  }
}

/** API cho trang quản trị: bắt buộc đăng nhập; chỉ ADMIN được tạo/sửa/khoá bác sĩ. */
@ApiTags('Doctor')
@ApiBearerAuth()
@Controller('admin/doctors')
@Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminDoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  findAll(
    @Query('serviceId') serviceId?: string,
    @Query('specializationId') specializationId?: string,
    @Query('view') view?: string,
  ) {
    return this.doctorService.getAllDoctors(
      serviceId,
      specializationId,
      toView(view),
      'staff',
    );
  }

  /** Danh sách tên chuyên khoa đang dùng, để gợi ý khi tạo/sửa bác sĩ */
  @Get('specializations')
  listSpecializations() {
    return this.doctorService.listSpecializationNames();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorService.getDoctorById(id, 'staff');
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorService.createDoctor(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorService.updateDoctor(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.doctorService.deleteDoctor(id);
  }
}
