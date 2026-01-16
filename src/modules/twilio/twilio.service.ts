import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { twiml } from 'twilio';

// Twilio's SayAttributes type for voice configuration
type SayAttributes = {
    voice?: string;
    language?: string;
};

@Injectable()
export class TwilioService {
    private readonly logger = new Logger(TwilioService.name);
    private readonly voiceConfig: SayAttributes;

    constructor(private readonly configService: ConfigService) {
        this.voiceConfig = {
            voice: this.configService.get<string>('TWILIO_VOICE', 'Polly.Joanna'),
            language: this.configService.get<string>('TWILIO_VOICE_LANGUAGE', 'en-US'),
        };
    }

    /**
     * Generate TwiML for initial greeting and speech gathering
     * @param webhookUrl - Base URL for webhooks
     * @param isLowConfidence - If true, shows "didn't understand" message instead of greeting
     */
    generateGreeting(webhookUrl: string, isLowConfidence: boolean = false): string {
        const response = new twiml.VoiceResponse();

        // Use type assertion for Twilio's strict types
        if (isLowConfidence) {
            (response.say as Function)(
                this.voiceConfig,
                'I did not understand your response. Please try again.',
            );
        } else {
            (response.say as Function)(
                this.voiceConfig,
                'Hello! I am your AI assistant. How can I help you today?',
            );
        }

        response.gather({
            input: ['speech'],
            timeout: 5,
            speechTimeout: 'auto',
            action: `${webhookUrl}/api/twilio/voice/respond`,
            method: 'POST',
        });

        // If no speech detected, prompt again
        (response.say as Function)(
            this.voiceConfig,
            "I didn't hear anything. Please try again.",
        );
        response.redirect(`${webhookUrl}/api/twilio/voice`);

        this.logger.debug('Generated greeting TwiML');
        return response.toString();
    }

    /**
     * Generate TwiML for AI response with continue gathering
     */
    generateAIResponse(aiResponse: string, webhookUrl: string): string {
        const response = new twiml.VoiceResponse();

        (response.say as Function)(this.voiceConfig, aiResponse);

        response.gather({
            input: ['speech'],
            timeout: 5,
            speechTimeout: 'auto',
            action: `${webhookUrl}/api/twilio/voice/respond`,
            method: 'POST',
        });

        // If no speech detected after AI response, ask if they need anything else
        (response.say as Function)(
            this.voiceConfig,
            'Is there anything else I can help you with?',
        );

        response.gather({
            input: ['speech'],
            timeout: 5,
            speechTimeout: 'auto',
            action: `${webhookUrl}/api/twilio/voice/respond`,
            method: 'POST',
        });

        // End call after no response
        (response.say as Function)(
            this.voiceConfig,
            'Thank you for calling. Goodbye!',
        );
        response.hangup();

        this.logger.debug(`Generated AI response TwiML for: ${aiResponse.substring(0, 50)}...`);
        return response.toString();
    }

    /**
     * Generate TwiML for error response
     */
    generateErrorResponse(): string {
        const response = new twiml.VoiceResponse();

        (response.say as Function)(
            this.voiceConfig,
            "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        );
        response.hangup();

        return response.toString();
    }

    /**
     * Generate TwiML for goodbye
     */
    generateGoodbye(): string {
        const response = new twiml.VoiceResponse();

        (response.say as Function)(
            this.voiceConfig,
            'Thank you for calling. Have a great day! Goodbye.',
        );
        response.hangup();

        return response.toString();
    }
}
