import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

// Provider modules - Wire up Clean Architecture layers
import { ApplicationModule } from './application.module';
import { InfrastructureModule } from './infrastructure.module';

// Feature modules - HTTP endpoints organized by domain
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { MapsModule } from './modules/maps/maps.module';
import { BenchmarkModule } from './modules/benchmark/benchmark.module';
import { FeaturesModule } from './modules/features/features.module';
import { HealthModule } from './modules/health/health.module';

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
    // Provider modules - Wire up the Clean Architecture layers from packages/
    ApplicationModule,      // Provides use cases from packages/application
    InfrastructureModule,  // Provides services from packages/infrastructure
    // Feature modules - HTTP endpoints organized by domain
    AuthModule,
    AdminModule,
    MapsModule,
    BenchmarkModule,
    FeaturesModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}