import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportService } from './report.service';

@ApiTags('Report')
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
