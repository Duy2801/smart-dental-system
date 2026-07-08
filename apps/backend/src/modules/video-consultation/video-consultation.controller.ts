import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Video Consultation')
@Controller('video-consultations')
export class VideoConsultationController {}
