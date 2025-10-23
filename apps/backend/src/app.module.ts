import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AdminModule } from './admin/admin.module';
import { ApplicationModule } from './application/application.module';
import { AuthModule } from './auth/auth.module';
import { FeaturesController } from './features.controller';
import { HealthController } from './health.controller';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { MapsController } from './maps.controller';
import { TestErrorController } from './test-error.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',                    // First priority: local .env in backend directory
        '.env.local',              // Second priority: local overrides
        join(__dirname, '../.env'), // Fallback to backend directory if running from dist
      ],
      expandVariables: true,        // Allow ${VAR} syntax in .env files
    }),
    ApplicationModule,
    InfrastructureModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [
    HealthController,
    MapsController,
    FeaturesController,
    // Add test controller only in development
    ...(process.env.NODE_ENV !== 'production' ? [TestErrorController] : []),
  ],
  providers: [],
})
export class AppModule {}
