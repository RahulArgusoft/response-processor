import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { AiGatewayService } from './ai-gateway.service';

class AiTestDto {
    @IsString()
    @IsNotEmpty()
    question: string;
}

@Controller('ai')
export class AiController {
    private readonly logger = new Logger(AiController.name);

    constructor(private readonly aiGatewayService: AiGatewayService) { }

    /**
     * Test endpoint for AI - POST /api/ai/test
     * Body: { "question": "What is the capital of France?" }
     */
    @Post('test')
    async testAi(@Body() body: AiTestDto) {
        this.logger.log(`Testing AI with question: "${body.question}"`);

        try {
            const response = await this.aiGatewayService.generateResponse(body.question);
            return {
                success: true,
                question: body.question,
                answer: response,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error('AI test failed', error);
            return {
                success: false,
                question: body.question,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Health check for AI module
     */
    @Get('status')
    getStatus() {
        return {
            module: 'ai',
            status: 'operational',
            timestamp: new Date().toISOString(),
        };
    }
}
