import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    private pool: pg.Pool;
    private isConnected = false;

    constructor() {
        const connectionString =
            process.env.DATABASE_URL ||
            'postgresql://postgres:postgres@localhost:5436/response_processor?schema=public';

        const pool = new pg.Pool({ connectionString });
        const adapter = new PrismaPg(pool);

        super({ adapter });
        this.pool = pool;
    }

    async onModuleInit() {
        this.logger.log('Connecting to database...');

        try {
            // Actually try to connect and run a query
            await this.$connect();
            await this.$queryRaw`SELECT 1`;

            this.isConnected = true;
            this.logger.log('Database connected successfully');
        } catch (error) {
            this.isConnected = false;
            this.logger.error('Failed to connect to database!', error instanceof Error ? error.message : error);
            this.logger.warn('Application will continue but database operations will fail');
            // Don't throw - let the app start but database calls will fail gracefully
        }
    }

    async onModuleDestroy() {
        if (this.isConnected) {
            this.logger.log('Disconnecting from database...');
            await this.$disconnect();
            await this.pool.end();
            this.logger.log('Database disconnected');
        }
    }

    /**
     * Health check for database connection
     */
    async isHealthy(): Promise<boolean> {
        if (!this.isConnected) {
            return false;
        }

        try {
            await this.$queryRaw`SELECT 1`;
            return true;
        } catch {
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Check if database is connected
     */
    getConnectionStatus(): boolean {
        return this.isConnected;
    }
}
