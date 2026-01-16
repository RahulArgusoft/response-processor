import { Module } from '@nestjs/common';
import { ConfigModule } from './modules/common/config/config.module';
import { DatabaseModule } from './modules/common/database/database.module';
import { EmailModule } from './modules/email/email.module';
import { TwilioModule } from './modules/twilio/twilio.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Core modules
    ConfigModule,
    DatabaseModule,

    // Feature modules
    EmailModule,
    TwilioModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule { }

