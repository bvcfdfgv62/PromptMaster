import winston from 'winston';

/**
 * Structured Logger for PromptMaster Enterprise
 * 
 * Following Netflix/Stripe observability standards:
 * - Structured JSON logs
 * - Contextual metadata
 * - Multiple log levels
 * - Production-ready transports
 */

const isDevelopment = import.meta.env.MODE === 'development';

// Custom format for development (readable)
const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `[${timestamp}] ${level}: ${message} ${metaStr}`;
    })
);

// Production format (structured JSON)
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
    level: isDevelopment ? 'debug' : 'info',
    format: isDevelopment ? devFormat : prodFormat,
    defaultMeta: {
        service: 'promptmaster-enterprise',
        environment: import.meta.env.MODE
    },
    transports: [
        // Console transport (always active)
        new winston.transports.Console({
            stderrLevels: ['error']
        })
    ]
});

// Add file transports in production
if (!isDevelopment) {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));

    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));
}

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
    error: Error,
    context?: Record<string, any>
) => {
    logger.error(message, {
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name
        },
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
    logger.info('API call', {
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
    logger.warn('Security event', {
        event,
        severity,
        timestamp: new Date().toISOString(),
        ...metadata
    });
};

// Export default logger
export default logger;
