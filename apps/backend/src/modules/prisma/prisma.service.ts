import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });

    super({ adapter });
  }

  async onModuleInit() {
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        await this.$connect();
        // The driver adapter can defer the network connection until the first query.
        await this.$queryRaw`SELECT 1`;
        return;
      } catch (error) {
        if (attempt === 4) throw error;
        this.logger.warn(
          `Database not ready (attempt ${attempt}/4); retrying startup`,
        );
        await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
      }
    }
  }
}
