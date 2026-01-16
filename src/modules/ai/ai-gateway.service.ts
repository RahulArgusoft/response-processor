import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

@Injectable()
export class AiGatewayService {
    private readonly logger = new Logger(AiGatewayService.name);
    private readonly openai: OpenAI;
    private readonly model: string;

    constructor(private readonly configService: ConfigService) {
        this.openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: this.configService.get<string>('OPENROUTER_API_KEY'),
            defaultHeaders: {
                'HTTP-Referer': this.configService.get<string>('APP_URL', 'http://localhost:3000'),
                'X-Title': this.configService.get<string>('APP_NAME', 'Response Processor'),
            },
        });
        // this.model = this.configService.get<string>('OPENROUTER_MODEL', 'anthropic/claude-3-haiku')
        this.model = this.configService.get<string>('OPENROUTER_MODEL', 'allenai/molmo-2-8b:free');
    }

    /**
     * Generate AI response for voice conversation
     */
    async generateResponse(
        userMessage: string,
        conversationHistory: Message[] = [],
    ): Promise<string> {
        this.logger.log(`Generating AI response for: "${userMessage}"`);

        try {
            const messages: Message[] = [
                {
                    role: 'system',
                    content: `You are a friendly and helpful AI voice assistant. 
Keep your responses concise and natural for speech - aim for 1-3 sentences.
Avoid using special characters, markdown, or formatting since your response will be read aloud.
Be conversational and helpful.`,
                },
                ...conversationHistory,
                {
                    role: 'user',
                    content: userMessage,
                },
            ];

            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages,
                max_tokens: 150,
                temperature: 0.7,
            });



            const response = completion.choices[0]?.message?.content ||
                "I'm sorry, I couldn't generate a response. Please try again.";

            this.logger.log(`AI response: "${response}"`);
            return response;
        } catch (error) {
            this.logger.error('Failed to generate AI response', error);
            throw error;
        }
    }

    /**
     * Health check for AI service
     */
    async isHealthy(): Promise<boolean> {
        try {
            const response = await this.generateResponse('Hello');
            return response.length > 0;
        } catch {
            return false;
        }
    }
}
