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
