/**
 * Attachment entity representing an email attachment
 */
export interface Attachment {
    id?: string;
    emailId?: string;
    filename: string;
    contentType: string;
    size: number;
    content?: string; // Base64 encoded content
    contentId?: string;
    storagePath?: string;
    storageUrl?: string;
    processed?: boolean;
    processedAt?: Date;
}
