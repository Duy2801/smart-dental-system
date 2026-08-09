import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClinicConfigModule } from '../clinic-config/clinic-config.module';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notification/notification.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';

@Module({
  imports: [PrismaModule, ClinicConfigModule, MailModule, NotificationModule],
  controllers: [AppointmentController],
  providers: [AppointmentService, RolesGuard],
  exports: [AppointmentService],
})
export class AppointmentModule {}

