import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { Email } from '@prisma/client';

@Injectable()
export class AutoReplyService {
    private readonly logger = new Logger(AutoReplyService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Send an auto-reply to the email sender
     */
    async sendAutoReply(email: Email): Promise<boolean> {
        this.logger.log(`Checking auto-reply for email from: ${email.from}`);

        // Check if auto-reply should be sent
        if (!this.shouldSendAutoReply(email)) {
            this.logger.log('Auto-reply not configured or not applicable');
            return false;
        }

        try {
            const replyContent = this.generateAutoReplyContent(email);
            const subject = `Re: ${email.subject}`;

            // Create auto-reply record in database
            const autoReply = await this.prisma.autoReply.create({
                data: {
                    emailId: email.id,
                    to: email.from,
                    subject: subject,
                    body: replyContent,
                    status: 'pending',
                },
            });

            // TODO: Integrate with email sending service (SendGrid, SES, etc.)
            this.logger.log(`Created auto-reply record: ${autoReply.id}`);

            // Mark as sent (simulate sending)
            await this.prisma.autoReply.update({
                where: { id: autoReply.id },
                data: {
                    status: 'sent',
                    sentAt: new Date(),
                },
            });

            return true;
        } catch (error) {
            this.logger.error('Failed to send auto-reply', error);
            return false;
        }
    }

    /**
     * Determine if an auto-reply should be sent
     */
    private shouldSendAutoReply(email: Email): boolean {
        // Don't reply to automated emails
        const automatedPatterns = [
            'noreply@',
            'no-reply@',
            'donotreply@',
            'mailer-daemon@',
            'postmaster@',
        ];

        const fromLower = email.from.toLowerCase();
        if (automatedPatterns.some((pattern) => fromLower.includes(pattern))) {
            return false;
        }

        // Don't reply to bounce notifications
        if (
            email.subject?.toLowerCase().includes('undeliverable') ||
            email.subject?.toLowerCase().includes('delivery failed')
        ) {
            return false;
        }

        // TODO: Check user/organization auto-reply settings from config

        return true;
    }

    /**
     * Generate auto-reply content
     */
    private generateAutoReplyContent(email: Email): string {
        // TODO: Load template from database or configuration
        return `
Thank you for your email.

We have received your message and will get back to you shortly.

This is an automated response.

Best regards,
Response Processor
    `.trim();
    }
}
