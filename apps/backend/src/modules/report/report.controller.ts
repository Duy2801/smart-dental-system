import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportService } from './report.service';

@ApiTags('Report')
@ApiBearerAuth()
@Roles('ADMIN', 'RECEPTIONIST')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['reports', 'admin/reports'])
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('overview')
  getOverview(@Query() query: ReportQueryDto) {
    return this.reportService.getOverview(query.timeFilter);
  }

  @Get('dashboard')
  getDashboard() {
    return this.reportService.getDashboard();
  }
}

