import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mailConfig from './mail.config';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule.forFeature(mailConfig),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');

        if (redisUrl) {
          const url = new URL(redisUrl);
          return {
            redis: {
              host: url.hostname,
              port: Number(url.port || 6379),
              username: url.username
                ? decodeURIComponent(url.username)
                : undefined,
              password: url.password
                ? decodeURIComponent(url.password)
                : undefined,
              tls: url.protocol === 'rediss:' ? {} : undefined,
              enableReadyCheck: false,
              maxRetriesPerRequest: null,
            },
          };
        }

        return {
          redis: {
            host: config.get<string>('REDIS_HOST', '127.0.0.1'),
            port: config.get<number>('REDIS_PORT', 6379),
            username: config.get<string>('REDIS_USERNAME'),
            password: config.get<string>('REDIS_PASSWORD'),
            tls: config.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
            enableReadyCheck: false,
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: 'mail-queue' }),
  ],
  providers: [MailService, MailProcessor],
  exports: [BullModule],
})
export class MailModule {}
