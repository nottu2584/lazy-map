import { Module, Global } from '@nestjs/common';
import { BackLoggingService } from './BackLoggingService';

/**
 * Token for injecting the ILogger interface
 */
export const LOGGER_TOKEN = 'ILogger';

/**
 * Global logging module that provides the ILogger interface (backend)
 * This module makes logging available throughout the backend application
 */
@Global()
@Module({
  providers: [
    {
      provide: LOGGER_TOKEN,
      useFactory: () => {
        return new BackLoggingService('LazyMapApp');
      }
    }
  ],
  exports: [LOGGER_TOKEN]
})
export class LoggingModule {}