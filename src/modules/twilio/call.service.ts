import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class CallService {
    private readonly logger = new Logger(CallService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create or get existing call record
     */
    async createCall(data: {
        callSid: string;
        from: string;
        to: string;
        direction?: string;
    }) {
        try {
            // Use upsert to handle duplicate webhook calls for same CallSid
            const call = await this.prisma.call.upsert({
                where: { callSid: data.callSid },
                update: {}, // Don't update anything if exists
                create: {
                    callSid: data.callSid,
                    from: data.from,
                    to: data.to,
                    direction: data.direction || 'inbound',
                    status: 'initiated',
                },
            });
            this.logger.log(`Call record: ${call.id} (SID: ${data.callSid})`);
            return call;
        } catch (error) {
            this.logger.error(`Failed to create call record for ${data.callSid}`, error);
            throw error;
        }
    }

    /**
     * Get call by Twilio CallSid
     */
    async getCallBySid(callSid: string) {
        return this.prisma.call.findUnique({
            where: { callSid },
            include: { messages: true },
        });
    }

    /**
     * Add a message to a call
     */
    async addMessage(callSid: string, role: 'user' | 'assistant', content: string) {
        try {
            const call = await this.prisma.call.findUnique({
                where: { callSid },
            });

            if (!call) {
                this.logger.warn(`Call not found for SID: ${callSid}`);
                return null;
            }

            const message = await this.prisma.callMessage.create({
                data: {
                    callId: call.id,
                    role,
                    content,
                },
            });

            this.logger.debug(`Added ${role} message to call ${callSid}`);
            return message;
        } catch (error) {
            this.logger.error(`Failed to add message to call ${callSid}`, error);
            return null;
        }
    }

    /**
     * Update call status
     */
    async updateCallStatus(callSid: string, status: string, duration?: number) {
        try {
            const updateData: { status: string; duration?: number; endedAt?: Date } = { status };

            if (duration !== undefined) {
                updateData.duration = duration;
            }

            if (['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(status)) {
                updateData.endedAt = new Date();
            }

            const call = await this.prisma.call.update({
                where: { callSid },
                data: updateData,
            });

            this.logger.log(`Updated call ${callSid} status to: ${status}`);
            return call;
        } catch (error) {
            this.logger.error(`Failed to update call status for ${callSid}`, error);
            return null;
        }
    }

    /**
     * Get all calls with optional pagination
     */
    async getAllCalls(skip = 0, take = 20) {
        const [calls, total] = await Promise.all([
            this.prisma.call.findMany({
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' },
                    },
                },
            }),
            this.prisma.call.count(),
        ]);

        return { calls, total };
    }
}
