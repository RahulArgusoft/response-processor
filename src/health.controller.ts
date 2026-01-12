import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './modules/common/database/prisma.service';

@Controller('health')
export class HealthController {
    constructor(private readonly prismaService: PrismaService) { }

    /**
     * Basic health check endpoint
     */
    @Get()
    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }

    /**
     * Detailed health check including database status
     */
    @Get('detailed')
    async detailedCheck() {
        const dbHealthy = await this.prismaService.isHealthy();

        return {
            status: dbHealthy ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: {
                database: dbHealthy ? 'healthy' : 'unhealthy',
                email: 'healthy', // TODO: Add email service health check
            },
            memory: {
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
            },
        };
    }

    /**
     * Liveness probe for Kubernetes/Render
     */
    @Get('live')
    liveness() {
        return { status: 'alive' };
    }

    /**
     * Readiness probe for Kubernetes/Render
     */
    @Get('ready')
    async readiness() {
        const dbHealthy = await this.prismaService.isHealthy();
        return {
            status: dbHealthy ? 'ready' : 'not_ready',
        };
    }
}
