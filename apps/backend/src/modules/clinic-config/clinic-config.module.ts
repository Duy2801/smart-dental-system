import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicConfigController } from './clinic-config.controller';
import { ClinicConfigService } from './clinic-config.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClinicConfigController],
  providers: [ClinicConfigService],
  exports: [ClinicConfigService],
})
export class ClinicConfigModule {}
