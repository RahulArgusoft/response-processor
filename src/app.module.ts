import { Module } from '@nestjs/common';
import { ConfigModule } from './modules/common/config/config.module';
import { DatabaseModule } from './modules/common/database/database.module';
import { EmailModule } from './modules/email/email.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Core modules
    ConfigModule,
    DatabaseModule,

    // Feature modules
    EmailModule,

    // Future modules
    // PhoneModule, // Twilio integration - coming soon
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule { }
