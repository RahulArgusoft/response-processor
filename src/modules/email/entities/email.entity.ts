import { Attachment } from './attachment.entity';

/**
 * Email entity representing a processed email
 */
export interface Email {
    id: string;
    from: string;
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    textBody?: string;
    htmlBody?: string;
    attachments: Attachment[];
    headers: Record<string, string>;
    receivedAt: Date;
    processed: boolean;
    processedAt?: Date;
    metadata?: Record<string, any>;
}
