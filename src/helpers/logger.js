import config from 'config';
import path from 'path';
import winston from 'winston';

export default class Logger {
  constructor() {
    this.logFileName = path.join(__dirname, '../../', 'logs/ashwani-app-builder.app.log');
    this.errorLogFileName = path.join(__dirname, '../../', 'logs/ashwani-app-builder.error.log');
    this.logger = null;
  }

  async init() {
    this.logger = winston.createLogger({
      format: winston.format.json(),
      // Do NOT exit/teardown the log streams on an uncaught exception.
      // A non-fatal error (e.g. an FCM push failure) must not crash the API,
      // and exiting here caused a "write after end" cascade that killed it.
      exitOnError: false,
      exceptionHandlers: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: this.errorLogFileName,
          level: 'error',
          maxSize: config.logger.maxSize,
          maxFiles: config.logger.maxFiles,
        }),
      ],
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: this.logFileName,
          maxSize: config.logger.maxSize,
          maxFiles: config.logger.maxFiles,
        }),
      ],
    });

    // Safety net: a rejected async call (e.g. FCM) should be logged, never fatal.
    process.on('unhandledRejection', (reason) => {
      const msg = (reason && reason.message) || String(reason);
      console.error('[unhandledRejection]', msg);
    });
  }

  logInfo(message, data) {
    // this.logger.log('info', message, data);
  }

  logError(message, data) {
    this.logger.log('error', message, data);
  }

  logWarn(message, data) {
    this.logger.log('warn', message, data);
  }

  logDebug(message, data) {
    // this.logger.log('debug', message, data);
  }

  logSilly(message, data) {
    this.logger.log('silly', message, data);
  }
 
}
