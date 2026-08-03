import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { ChatbotConversationModule } from './modules/chatbot-conversation/chatbot-conversation.module';
import { ClinicalCaseModule } from './modules/clinical-case/clinical-case.module';
import { ClinicConfigModule } from './modules/clinic-config/clinic-config.module';
import { DoctorAvailabilityModule } from './modules/doctor-availability/doctor-availability.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { MedicalRecordModule } from './modules/medical-record/medical-record.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PatientModule } from './modules/patient/patient.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PermissionModule } from './modules/permission/permission.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import { ReviewModule } from './modules/review/review.module';
import { RoleModule } from './modules/role/role.module';
import { ReportModule } from './modules/report/report.module';
import { ServiceModule } from './modules/service/service.module';
import { TreatmentPlanModule } from './modules/treatment-plan/treatment-plan.module';
import { VideoConsultationModule } from './modules/video-consultation/video-consultation.module';
import { PrescriptionModule } from './modules/prescription/prescription.module';
import { BannerModule } from './modules/banner/banner.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UserModule,
    ClinicalCaseModule,
    ClinicConfigModule,
    RoleModule,
    PermissionModule,
    ServiceModule,
    PromotionModule,
    PatientModule,
    DoctorModule,
    DoctorAvailabilityModule,
    AppointmentModule,
    MedicalRecordModule,
    TreatmentPlanModule,
    InvoiceModule,
    PaymentModule,
    ReviewModule,
    ReportModule,
    ChatbotConversationModule,
    VideoConsultationModule,
    NotificationModule,
    PrescriptionModule,
    BannerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
