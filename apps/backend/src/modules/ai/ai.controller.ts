import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/curent-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AiService } from './ai.service';
import { DraftMedicalRecordDto } from './dto/draft-medical-record.dto';
import { DraftPrescriptionDto } from './dto/draft-prescription.dto';
import { DraftTreatmentPlanDto } from './dto/draft-treatment-plan.dto';
import {
  AnalyzeXrayDto,
  ExplainTreatmentPlanDto,
  GenerateAftercareDto,
  ReviewPrescriptionDto,
  SendAftercareDto,
} from './dto/doctor-ai.dto';
import { SummarizePatientDto } from './dto/summarize-patient.dto';
import { ReviewPatientAiBriefDto } from './dto/review-patient-ai-brief.dto';

@ApiTags('AI Doctor Assist')
@ApiBearerAuth()
@Controller(['ai/doctor', 'admin/ai/doctor'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DOCTOR', 'ADMIN')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('summarize-patient/latest')
  getLatestPatientSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: SummarizePatientDto,
  ) {
    return this.aiService.getLatestPatientSummary(user, dto);
  }

  @Patch('patient-brief/:id/review')
  reviewPatientSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewPatientAiBriefDto,
  ) {
    return this.aiService.reviewPatientSummary(user, id, dto);
  }

  @Get('patient-brief/quality-metrics')
  getPatientBriefQualityMetrics(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.getPatientBriefQualityMetrics(user);
  }

  @Post('summarize-patient')
  summarizePatient(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SummarizePatientDto,
  ) {
    return this.aiService.summarizePatient(user, dto);
  }

  @Post('draft-medical-record')
  draftMedicalRecord(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DraftMedicalRecordDto,
  ) {
    return this.aiService.draftMedicalRecord(user, dto);
  }

  @Post('draft-prescription')
  draftPrescription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DraftPrescriptionDto,
  ) {
    return this.aiService.draftPrescription(user, dto);
  }

  @Post('draft-treatment-plan')
  draftTreatmentPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DraftTreatmentPlanDto,
  ) {
    return this.aiService.draftTreatmentPlan(user, dto);
  }

  @Post('review-prescription')
  reviewPrescription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewPrescriptionDto,
  ) {
    return this.aiService.reviewPrescription(user, dto);
  }

  @Post('generate-aftercare')
  generateAftercare(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateAftercareDto,
  ) {
    return this.aiService.generateAftercare(user, dto);
  }

  @Post('send-aftercare')
  sendAftercare(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendAftercareDto,
  ) {
    return this.aiService.sendAftercare(user, dto);
  }

  @Post('explain-treatment-plan')
  explainTreatmentPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ExplainTreatmentPlanDto,
  ) {
    return this.aiService.explainTreatmentPlan(user, dto);
  }

  @Post('analyze-xray')
  analyzeXray(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AnalyzeXrayDto,
  ) {
    return this.aiService.analyzeXray(user, dto);
  }
}
