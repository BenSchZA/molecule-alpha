import { Logger, Injectable } from '@nestjs/common';
import { createLogger, transports, format } from 'winston';

export enum LogLevel {
  info = 'info',
  warn = 'warn',
  error = 'error',
  debug = 'debug',
  verbose = 'verbose',
}

@Injectable()
export class LoggerService extends Logger {
  private readonly winstonLogger = createLogger({
    transports: [
      new transports.File({
        filename: 'apiserver.log',
        level: LogLevel.debug,
        format: format.combine(
          format.timestamp(),
          format.metadata(),
          format.prettyPrint(),
          format.json(),
        ),
      }),
    ],
  })

  constructor(private readonly loggerContext: string = '') {
    super(loggerContext);
  }
  
  log(message: any, context?: string) {
    this.winstonLogger.log(LogLevel.info, message, {context});
    super.log(message, context);
  }
  
  info(message: any, context?: string) {
    this.winstonLogger.info(message, {context});
    super.log(message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.winstonLogger.error(message, {context});
    if (trace) {
      this.winstonLogger.error(trace)
    }
    super.error(message, trace, context);
  }
  
  warn(message: any, context?: string) {
    this.winstonLogger.warn(message, {context});
    super.warn(message, context);
  }
  
  debug(message: any, context?: string) {
    this.winstonLogger.debug(message, {context});
    super.debug(message, context);
  }
  
  verbose(message: any, context?: string) {
    this.winstonLogger.verbose(message, context);
    super.verbose(message, context);
  }

  startTimer() {
    return this.winstonLogger.startTimer();
  }
}