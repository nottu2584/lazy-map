import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MapsController } from './maps.controller';
import { FeaturesController } from './features.controller';
import { ApplicationModule } from './application/application.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ApplicationModule,
    InfrastructureModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [AppController, MapsController, FeaturesController],
  providers: [AppService],
})
export class AppModule {}
