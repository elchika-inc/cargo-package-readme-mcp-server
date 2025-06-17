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
    // Suppress unused variable warning
    void this.level;
  }

  private formatMessage(_level: string, _message: string, _meta?: unknown): string {
    // Disabled for MCP servers
    return '';
  }

  private shouldLog(_level: LogLevel): boolean {
    // Disabled for MCP servers
    return false;
  }

  debug(_message: string, _meta?: unknown): void {
    // Disable all console output for MCP servers to prevent JSON-RPC corruption
    return;
  }

  info(_message: string, _meta?: unknown): void {
    // Disable all console output for MCP servers to prevent JSON-RPC corruption
    return;
  }

  warn(_message: string, _meta?: unknown): void {
    // Disable all console output for MCP servers to prevent JSON-RPC corruption
    return;
  }

  error(_message: string, _meta?: unknown): void {
    // Disable all console output for MCP servers to prevent JSON-RPC corruption
    return;
  }

  setLevel(_level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'): void {
    // Disabled for MCP servers
    return;
  }
}

export const logger = new Logger();