import { Module, Global } from '@nestjs/common';
import { LoggingService } from './LoggingService';

/**
 * Token for injecting the ILogger interface
 */
export const LOGGER_TOKEN = 'ILogger';

/**
 * Global logging module that provides the ILogger interface
 * This module makes logging available throughout the application
 */
@Global()
@Module({
  providers: [
    {
      provide: LOGGER_TOKEN,
      useFactory: () => {
        return new LoggingService('LazyMapApp');
      }
    },
    LoggingService
  ],
  exports: [LOGGER_TOKEN, LoggingService]
})
export class LoggingModule {}