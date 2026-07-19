import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClinicalCaseService } from './clinical-case.service';

@ApiTags('Clinical Case')
@Controller(['clinical-cases', 'admin/clinical-cases'])
export class ClinicalCaseController {
  constructor(private readonly clinicalCaseService: ClinicalCaseService) {}

  @Get()
  findPublished(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit);
    return this.clinicalCaseService.findPublished(
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 6,
    );
  }
}
