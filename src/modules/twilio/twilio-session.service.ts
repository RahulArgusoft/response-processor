import { Injectable, Logger } from '@nestjs/common';

interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface Session {
    callSid: string;
    from: string;
    to: string;
    messages: ConversationMessage[];
    createdAt: Date;
    lastActivityAt: Date;
}

@Injectable()
export class TwilioSessionService {
    private readonly logger = new Logger(TwilioSessionService.name);
    private readonly sessions = new Map<string, Session>();
    private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    /**
     * Create or get existing session for a call
     */
    getOrCreateSession(callSid: string, from: string, to: string): Session {
        let session = this.sessions.get(callSid);

        if (!session) {
            session = {
                callSid,
                from,
                to,
                messages: [],
                createdAt: new Date(),
                lastActivityAt: new Date(),
            };
            this.sessions.set(callSid, session);
            this.logger.log(`Created new session for call: ${callSid}`);
        } else {
            session.lastActivityAt = new Date();
        }

        return session;
    }

    /**
     * Add a message to the session
     */
    addMessage(callSid: string, role: 'user' | 'assistant', content: string): void {
        const session = this.sessions.get(callSid);
        if (session) {
            session.messages.push({
                role,
                content,
                timestamp: new Date(),
            });
            session.lastActivityAt = new Date();
        }
    }

    /**
     * Get conversation history for AI context
     */
    getConversationHistory(callSid: string): Array<{ role: 'user' | 'assistant'; content: string }> {
        const session = this.sessions.get(callSid);
        if (!session) return [];

        return session.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));
    }

    /**
     * End and cleanup session
     */
    endSession(callSid: string): Session | undefined {
        const session = this.sessions.get(callSid);
        if (session) {
            this.sessions.delete(callSid);
            this.logger.log(`Ended session for call: ${callSid}`);
        }
        return session;
    }

    /**
     * Get session by call SID
     */
    getSession(callSid: string): Session | undefined {
        return this.sessions.get(callSid);
    }

    /**
     * Cleanup expired sessions (call periodically)
     */
    cleanupExpiredSessions(): number {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [callSid, session] of this.sessions) {
            if (now - session.lastActivityAt.getTime() > this.SESSION_TIMEOUT_MS) {
                this.sessions.delete(callSid);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.logger.log(`Cleaned up ${cleanedCount} expired sessions`);
        }

        return cleanedCount;
    }
}
