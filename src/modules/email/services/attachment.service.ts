import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { Attachment } from '@prisma/client';

@Injectable()
export class AttachmentService {
    private readonly logger = new Logger(AttachmentService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Process attachments for an email
     */
    async processAttachments(attachmentIds: string[]): Promise<Attachment[]> {
        this.logger.log(`Processing ${attachmentIds.length} attachments`);

        const processedAttachments: Attachment[] = [];

        for (const id of attachmentIds) {
            const attachment = await this.prisma.attachment.findUnique({
                where: { id },
            });

            if (attachment) {
                const processed = await this.processAttachment(attachment);
                processedAttachments.push(processed);
            }
        }

        return processedAttachments;
    }

    /**
     * Process a single attachment
     */
    private async processAttachment(attachment: Attachment): Promise<Attachment> {
        this.logger.log(
            `Processing attachment: ${attachment.filename} (${attachment.contentType})`,
        );

        // TODO: Store attachment to file storage (S3, local, etc.)
        // TODO: Generate signed URL for access
        // TODO: Run virus scan if needed

        // Update attachment as processed in database
        return this.prisma.attachment.update({
            where: { id: attachment.id },
            data: {
                processed: true,
                processedAt: new Date(),
                // storagePath: '/path/to/stored/file',
                // storageUrl: 'https://storage.url/file',
            },
        });
    }

    /**
     * Get attachments by email ID
     */
    async getAttachmentsByEmailId(emailId: string): Promise<Attachment[]> {
        return this.prisma.attachment.findMany({
            where: { emailId },
        });
    }

    /**
     * Validate attachment type and size
     */
    validateAttachment(contentType: string, size: number): boolean {
        const maxSize = 25 * 1024 * 1024; // 25MB
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (size > maxSize) {
            this.logger.warn(`Attachment too large: ${size} bytes`);
            return false;
        }

        if (!allowedTypes.includes(contentType)) {
            this.logger.warn(`Attachment type not allowed: ${contentType}`);
            return false;
        }

        return true;
    }
}
