import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

/**
 * DTO for inbound emails received via webhook
 * This structure is compatible with common email providers like SendGrid, Mailgun
 */
export class InboundEmailDto {
    @IsString()
    from: string;

    @IsString()
    to: string;

    @IsOptional()
    @IsString()
    cc?: string;

    @IsOptional()
    @IsString()
    bcc?: string;

    @IsString()
    subject: string;

    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsString()
    html?: string;

    @IsOptional()
    @IsArray()
    attachments?: AttachmentDto[];

    @IsOptional()
    @IsObject()
    headers?: Record<string, string>;

    @IsOptional()
    @IsString()
    envelope?: string;

    @IsOptional()
    @IsString()
    charsets?: string;

    @IsOptional()
    @IsString()
    spamScore?: string;

    @IsOptional()
    @IsString()
    spamReport?: string;
}

export class AttachmentDto {
    @IsString()
    filename: string;

    @IsString()
    contentType: string;

    @IsOptional()
    @IsString()
    content?: string; // Base64 encoded content

    size: number;

    @IsOptional()
    @IsString()
    contentId?: string;
}
