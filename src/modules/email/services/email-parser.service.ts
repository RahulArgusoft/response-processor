import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { InboundEmailDto } from '../dto/inbound-email.dto';
import { Email } from '@prisma/client';

@Injectable()
export class EmailParserService {
    private readonly logger = new Logger(EmailParserService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Parse the inbound email DTO and save to database
     */
    async parseEmail(inboundEmailDto: InboundEmailDto): Promise<Email> {
        this.logger.log(`Parsing email from: ${inboundEmailDto.from}`);

        // Create email with attachments in a transaction
        const email = await this.prisma.email.create({
            data: {
                from: inboundEmailDto.from,
                to: inboundEmailDto.to,
                cc: inboundEmailDto.cc,
                bcc: inboundEmailDto.bcc,
                subject: inboundEmailDto.subject,
                textBody: inboundEmailDto.text,
                htmlBody: inboundEmailDto.html,
                headers: inboundEmailDto.headers || {},
                attachments: {
                    create: (inboundEmailDto.attachments || []).map((att) => ({
                        filename: att.filename,
                        contentType: att.contentType,
                        size: att.size,
                        contentId: att.contentId,
                    })),
                },
            },
            include: {
                attachments: true,
            },
        });

        this.logger.log(`Email saved with ID: ${email.id}`);
        return email;
    }

    /**
     * Mark email as processed
     */
    async markAsProcessed(emailId: string): Promise<Email> {
        return this.prisma.email.update({
            where: { id: emailId },
            data: {
                processed: true,
                processedAt: new Date(),
            },
        });
    }

    /**
     * Get email by ID
     */
    async getEmailById(emailId: string): Promise<Email | null> {
        return this.prisma.email.findUnique({
            where: { id: emailId },
            include: {
                attachments: true,
                autoReplies: true,
            },
        });
    }

    /**
     * Get all emails with optional pagination
     */
    async getAllEmails(options?: { skip?: number; take?: number }) {
        const [emails, total] = await Promise.all([
            this.prisma.email.findMany({
                skip: options?.skip || 0,
                take: options?.take || 50,
                orderBy: { createdAt: 'desc' },
                include: {
                    attachments: true,
                    autoReplies: true,
                },
            }),
            this.prisma.email.count(),
        ]);

        return {
            data: emails,
            total,
            skip: options?.skip || 0,
            take: options?.take || 50,
        };
    }

    /**
     * Extract metadata from email headers
     */
    extractMetadata(headers: Record<string, string>): Record<string, any> {
        return {
            messageId: headers['message-id'],
            inReplyTo: headers['in-reply-to'],
            references: headers['references'],
            spamScore: headers['x-spam-score'],
            dkim: headers['dkim-signature'],
        };
    }
}
