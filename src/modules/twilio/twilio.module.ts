import { Module } from '@nestjs/common';
import { TwilioController } from './twilio.controller';
import { TwilioService } from './twilio.service';
import { TwilioSessionService } from './twilio-session.service';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [AiModule],
    controllers: [TwilioController],
    providers: [TwilioService, TwilioSessionService],
    exports: [TwilioService, TwilioSessionService],
})
export class TwilioModule { }
