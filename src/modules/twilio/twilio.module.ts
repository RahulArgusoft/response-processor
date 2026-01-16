import { Module } from '@nestjs/common';
import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';
import { TwilioSessionService } from './twilio-session.service';
import { CallService } from './call.service';
import { AiModule } from '../ai/ai.module';
import { DatabaseModule } from '../common/database/database.module';

@Module({
    imports: [AiModule, DatabaseModule],
    controllers: [TwilioController],
    providers: [TwilioService, TwilioSessionService, CallService],
    exports: [TwilioService, TwilioSessionService, CallService],
})
export class TwilioModule { }
