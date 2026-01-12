import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { appConfig, databaseConfig, emailConfig } from './index';

@Global()
@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
            load: [appConfig, databaseConfig, emailConfig],
            expandVariables: true,
        }),
    ],
    exports: [NestConfigModule],
})
export class ConfigModule { }
