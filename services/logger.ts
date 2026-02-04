/**
 * Structured Logger (Browser-Compatible)
 * 
 * Lightweight structured logging for browser and Node.js.
 * Follows Netflix/Stripe observability standards.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
    [key: string]: any;
}

const isDevelopment = import.meta.env.MODE === 'development';

class Logger {
    private level: LogLevel;

    constructor(level: LogLevel = isDevelopment ? 'debug' : 'info') {
        this.level = level;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }

    private formatMessage(level: LogLevel, message: string, meta?: LogMetadata): string {
        const timestamp = new Date().toISOString();

        if (isDevelopment) {
            // Development: Human-readable
            const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
            return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
        } else {
            // Production: Structured JSON
            return JSON.stringify({
                timestamp,
                level,
                message,
                service: 'promptmaster-enterprise',
                environment: import.meta.env.MODE,
                ...meta
            });
        }
    }

    debug(message: string, meta?: LogMetadata): void {
        if (this.shouldLog('debug')) {
            console.debug(this.formatMessage('debug', message, meta));
        }
    }

    info(message: string, meta?: LogMetadata): void {
        if (this.shouldLog('info')) {
            console.info(this.formatMessage('info', message, meta));
        }
    }

    warn(message: string, meta?: LogMetadata): void {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, meta));
        }
    }

    error(message: string, meta?: LogMetadata): void {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, meta));
        }
    }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Typed logging helpers with context
 */

export const logUserAction = (
    action: string,
    userId: string,
    metadata?: Record<string, any>
) => {
    logger.info(action, {
        userId,
        action,
        ...metadata
    });
};

export const logError = (
    message: string,
    error: Error | unknown,
    context?: Record<string, any>
) => {
    const errorDetails = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { error: String(error) };

    logger.error(message, {
        ...errorDetails,
        ...context
    });
};

export const logAPICall = (
    service: string,
    endpoint: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
) => {
    logger.info(`API call to ${service}`, {
        service,
        endpoint,
        duration,
        success,
        ...metadata
    });
};

export const logSecurityEvent = (
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>
) => {
    const logMethod = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    logger[logMethod](`Security event: ${event}`, {
        event,
        severity,
        ...metadata
    });
};
