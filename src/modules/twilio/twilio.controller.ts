import { Controller, Post, Body, Get, Logger, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from './twilio.service';
import { TwilioSessionService } from './twilio-session.service';
import { AiGatewayService } from '../ai/ai-gateway.service';

interface TwilioVoiceWebhookBody {
    CallSid: string;
    From: string;
    To: string;
    CallStatus: string;
    Direction: string;
    SpeechResult?: string;
    Confidence?: string;
}

@Controller('twilio')
export class TwilioController {
    private readonly logger = new Logger(TwilioController.name);
    private readonly webhookUrl: string;

    constructor(
        private readonly twilioService: TwilioService,
        private readonly sessionService: TwilioSessionService,
        private readonly aiGatewayService: AiGatewayService,
        private readonly configService: ConfigService,
    ) {
        this.webhookUrl = this.configService.get<string>('WEBHOOK_BASE_URL', 'http://localhost:3000');
    }

    /**
     * Initial voice webhook - called when call is answered
     * Twilio will POST to this endpoint
     */
    @Post('voice')
    async handleIncomingCall(
        @Body() body: TwilioVoiceWebhookBody,
        @Res() res: Response,
    ) {
        this.logger.log(`Incoming call from: ${body.From} to: ${body.To} (SID: ${body.CallSid})`);

        // Create session for this call
        this.sessionService.getOrCreateSession(body.CallSid, body.From, body.To);

        // Generate greeting TwiML
        const twimlResponse = this.twilioService.generateGreeting(this.webhookUrl);

        res.type('text/xml');
        res.send(twimlResponse);
    }

    /**
     * Voice response webhook - called after speech is gathered
     */
    @Post('voice/respond')
    async handleVoiceResponse(
        @Body() body: TwilioVoiceWebhookBody,
        @Res() res: Response,
    ) {
        const { CallSid, SpeechResult, Confidence } = body;
        this.logger.log(`Speech received for call ${CallSid}: "${SpeechResult}" (confidence: ${Confidence})`);

        let twimlResponse: string;

        try {
            if (!SpeechResult) {
                // No speech detected, generate re-prompt
                twimlResponse = this.twilioService.generateGreeting(this.webhookUrl);
            } else if(Confidence && parseFloat(Confidence) < 0.5) {
                // Low confidence, generate re-prompt
                twimlResponse = this.twilioService.generateGreeting(this.webhookUrl, true);

            } else {
                // Check for goodbye keywords
                const lowerSpeech = SpeechResult.toLowerCase();
                if (lowerSpeech.includes('goodbye') || lowerSpeech.includes('bye') || lowerSpeech.includes('hang up')) {
                    twimlResponse = this.twilioService.generateGoodbye();
                    this.sessionService.endSession(CallSid);
                } else {
                    // Add user message to session
                    this.sessionService.addMessage(CallSid, 'user', SpeechResult);

                    // Get conversation history for context
                    const history = this.sessionService.getConversationHistory(CallSid);

                    // Generate AI response
                    const aiResponse = await this.aiGatewayService.generateResponse(
                        SpeechResult,
                        history.slice(0, -1).map((m) => ({
                            role: m.role,
                            content: m.content,
                        })),
                    );

                    // Add AI response to session
                    this.sessionService.addMessage(CallSid, 'assistant', aiResponse);

                    // Generate TwiML response
                    twimlResponse = this.twilioService.generateAIResponse(aiResponse, this.webhookUrl);
                }
            }
        } catch (error) {
            this.logger.error(`Error processing voice response for call ${CallSid}`, error);
            twimlResponse = this.twilioService.generateErrorResponse();
        }

        res.type('text/xml');
        res.send(twimlResponse);
    }

    /**
     * Call status webhook - called when call status changes
     */
    @Post('voice/status')
    async handleCallStatus(@Body() body: TwilioVoiceWebhookBody) {
        const { CallSid, CallStatus } = body;
        this.logger.log(`Call ${CallSid} status changed to: ${CallStatus}`);

        // Cleanup session when call ends
        if (['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(CallStatus)) {
            const session = this.sessionService.endSession(CallSid);
            if (session) {
                this.logger.log(`Call ${CallSid} ended. Total messages: ${session.messages.length}`);
            }
        }
    }

    /**
     * Health/status endpoint for Twilio module
     */
    @Get('status')
    getStatus() {
        return {
            module: 'twilio',
            status: 'operational',
            timestamp: new Date().toISOString(),
        };
    }
}
