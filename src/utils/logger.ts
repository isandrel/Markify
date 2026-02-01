/**
 * Simple logging utility for Markify
 * Provides structured logging with levels and consistent formatting
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

class Logger {
    private level: LogLevel = LogLevel.INFO;
    private prefix: string;

    constructor(prefix: string = 'Markify') {
        this.prefix = prefix;
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    debug(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(`[${this.prefix}:DEBUG]`, message, ...args);
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.INFO) {
            console.log(`[${this.prefix}]`, message, ...args);
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.WARN) {
            console.warn(`[${this.prefix}:WARN]`, message, ...args);
        }
    }

    error(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.ERROR) {
            console.error(`[${this.prefix}:ERROR]`, message, ...args);
        }
    }
}

// Export logger instances for different modules
export const logger = new Logger('Markify');
export const batchLogger = new Logger('Markify:Batch');
export const adapterLogger = new Logger('Markify:Adapter');

// Set debug level in development
if (process.env.NODE_ENV === 'development') {
    logger.setLevel(LogLevel.DEBUG);
    batchLogger.setLevel(LogLevel.DEBUG);
    adapterLogger.setLevel(LogLevel.DEBUG);
}
