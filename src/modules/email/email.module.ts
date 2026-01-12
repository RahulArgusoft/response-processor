import { Module } from '@nestjs/common';
import { InboundEmailController } from './controllers/inbound-email.controller';
import { EmailParserService } from './services/email-parser.service';
import { AttachmentService } from './services/attachment.service';
import { AutoReplyService } from './services/auto-reply.service';

@Module({
    controllers: [InboundEmailController],
    providers: [EmailParserService, AttachmentService, AutoReplyService],
    exports: [EmailParserService, AttachmentService, AutoReplyService],
})
export class EmailModule { }
