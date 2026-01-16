import { Controller, Post, Body, Get, Logger, Query } from '@nestjs/common';
import { EmailParserService } from '../services/email-parser.service';
import { AttachmentService } from '../services/attachment.service';
import { AutoReplyService } from '../services/auto-reply.service';
import { InboundEmailDto } from '../dto/inbound-email.dto';

@Controller('email')
export class InboundEmailController {
    private readonly logger = new Logger(InboundEmailController.name);

    constructor(
        private readonly emailParserService: EmailParserService,
        private readonly attachmentService: AttachmentService,
        private readonly autoReplyService: AutoReplyService,
    ) { }

    /**
     * Get all emails with optional pagination
     * GET /api/email?skip=0&take=50
     */
    @Get()
    async getAllEmails(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
    ) {
        return this.emailParserService.getAllEmails({
            skip: skip ? parseInt(skip, 10) : undefined,
            take: take ? parseInt(take, 10) : undefined,
        });
    }

    /**
     * Webhook endpoint for receiving inbound emails
     * This will be called by email providers (SendGrid, Mailgun, etc.)
     */
    @Post('inbound')
    async handleInboundEmail(@Body() inboundEmailDto: InboundEmailDto) {
        this.logger.log('Received inbound email');

        try {
            // Parse and save the email to database
            const email = await this.emailParserService.parseEmail(inboundEmailDto);

            // Process attachments if any
            const attachments = await this.attachmentService.getAttachmentsByEmailId(
                email.id,
            );
            if (attachments.length > 0) {
                await this.attachmentService.processAttachments(
                    attachments.map((a) => a.id),
                );
            }

            // Send auto-reply if configured
            await this.autoReplyService.sendAutoReply(email);

            // Mark email as processed
            await this.emailParserService.markAsProcessed(email.id);

            return {
                success: true,
                message: 'Email processed successfully',
                emailId: email.id,
            };
        } catch (error) {
            this.logger.error('Failed to process inbound email', error);
            throw error;
        }
    }

    /**
     * Test endpoint to verify the email module is working
     */
    @Get('status')
    getStatus() {
        return {
            module: 'email',
            status: 'operational',
            timestamp: new Date().toISOString(),
        };
    }
}
