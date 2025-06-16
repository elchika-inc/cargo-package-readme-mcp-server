enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private level: LogLevel;

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    this.level = LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO;
  }

  private formatMessage(level: string, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (meta !== undefined) {
      return `${baseMessage} ${JSON.stringify(meta, null, 2)}`;
    }
    
    return baseMessage;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  debug(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }

  info(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, meta));
    }
  }

  warn(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
  }

  error(message: string, meta?: unknown): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, meta));
    }
  }

  setLevel(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'): void {
    this.level = LogLevel[level];
  }
}

export const logger = new Logger();