type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | ${typeof meta === 'object' ? JSON.stringify(meta) : meta}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
  }

  public debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.debug('\x1b[36m%s\x1b[0m', this.formatMessage('debug', message, meta));
    }
  }

  public info(message: string, meta?: any): void {
    console.log('\x1b[32m%s\x1b[0m', this.formatMessage('info', message, meta));
  }

  public warn(message: string, meta?: any): void {
    console.warn('\x1b[33m%s\x1b[0m', this.formatMessage('warn', message, meta));
  }

  public error(message: string, meta?: any): void {
    console.error('\x1b[31m%s\x1b[0m', this.formatMessage('error', message, meta));
  }
}

export const logger = new Logger();
