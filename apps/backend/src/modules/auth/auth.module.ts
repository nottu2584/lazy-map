import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ApplicationModule } from '../../application.module';
import { InfrastructureModule } from '../../infrastructure.module';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET', 'your-secret-key');
        console.log('[AuthModule JwtModule] JWT_SECRET for signing:', jwtSecret?.substring(0, 20) + '...');
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: '7d',
          },
        };
      },
      inject: [ConfigService],
    }),
    ApplicationModule,
    InfrastructureModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtAuthGuard, AdminGuard],
  exports: [JwtStrategy, JwtAuthGuard, AdminGuard, PassportModule],
})
export class AuthModule {}