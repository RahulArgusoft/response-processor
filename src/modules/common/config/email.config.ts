import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
    provider: process.env.EMAIL_PROVIDER || 'sendgrid', // sendgrid, mailgun, ses
    sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY || '',
        webhookSecret: process.env.SENDGRID_WEBHOOK_SECRET || '',
    },
    mailgun: {
        apiKey: process.env.MAILGUN_API_KEY || '',
        domain: process.env.MAILGUN_DOMAIN || '',
        webhookSigningKey: process.env.MAILGUN_WEBHOOK_SIGNING_KEY || '',
    },
    autoReply: {
        enabled: process.env.AUTO_REPLY_ENABLED === 'true',
        fromEmail: process.env.AUTO_REPLY_FROM || '',
        fromName: process.env.AUTO_REPLY_FROM_NAME || 'Response Processor',
    },
}));
