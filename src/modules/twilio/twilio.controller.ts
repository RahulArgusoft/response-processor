import { Controller, Post, Body, Get, Logger, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from './twilio.service';
import { TwilioSessionService } from './twilio-session.service';
import { CallService } from './call.service';
import { AiGatewayService } from '../ai/ai-gateway.service';

interface TwilioVoiceWebhookBody {
    CallSid: string;
    From: string;
    To: string;
    CallStatus: string;
    Direction: string;
    SpeechResult?: string;
    Confidence?: string;
    CallDuration?: string;
}

@Controller('twilio')
export class TwilioController {
    private readonly logger = new Logger(TwilioController.name);
    private readonly webhookUrl: string;

    constructor(
        private readonly twilioService: TwilioService,
        private readonly sessionService: TwilioSessionService,
        private readonly callService: CallService,
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

        // Save call to database (fire and forget - don't block response)
        this.callService.createCall({
            callSid: body.CallSid,
            from: body.From,
            to: body.To,
            direction: body.Direction || 'inbound',
        }).catch(err => this.logger.error('Failed to save call to DB', err));

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
            } else if (Confidence && parseFloat(Confidence) < 0.5) {
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

                    // Save user message to database (fire and forget)
                    this.callService.addMessage(CallSid, 'user', SpeechResult)
                        .catch(err => this.logger.error('Failed to save user message', err));

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

                    // Save AI response to database (fire and forget)
                    this.callService.addMessage(CallSid, 'assistant', aiResponse)
                        .catch(err => this.logger.error('Failed to save AI message', err));

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
        const { CallSid, CallStatus, CallDuration } = body;
        this.logger.log(`Call ${CallSid} status changed to: ${CallStatus}`);

        // Update call status in database
        const duration = CallDuration ? parseInt(CallDuration, 10) : undefined;
        this.callService.updateCallStatus(CallSid, CallStatus, duration)
            .catch(err => this.logger.error('Failed to update call status', err));

        // Cleanup session when call ends
        if (['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(CallStatus)) {
            const session = this.sessionService.endSession(CallSid);
            if (session) {
                this.logger.log(`Call ${CallSid} ended. Total messages: ${session.messages.length}`);
            }
        }
    }

    /**
     * Get all calls (for debugging/admin)
     */
    @Get('calls')
    async getCalls(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
    ) {
        const result = await this.callService.getAllCalls(
            skip ? parseInt(skip, 10) : 0,
            take ? parseInt(take, 10) : 20,
        );
        return result;
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
