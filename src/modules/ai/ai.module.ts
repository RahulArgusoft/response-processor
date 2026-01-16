import { Module } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';
import { AiController } from './ai.controller';

@Module({
    controllers: [AiController],
    providers: [AiGatewayService],
    exports: [AiGatewayService],
})
export class AiModule { }

