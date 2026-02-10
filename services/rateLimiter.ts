
import { logger } from "./logger";

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const WINDOW_SIZE_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

class RateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();

    checkLimit(userId: string): boolean {
        const now = Date.now();
        const entry = this.limits.get(userId);

        if (!entry || now > entry.resetTime) {
            // New window
            this.limits.set(userId, {
                count: 1,
                resetTime: now + WINDOW_SIZE_MS
            });
            return true;
        }

        if (entry.count < MAX_REQUESTS) {
            entry.count++;
            return true;
        }

        return false;
    }

    getResetTime(userId: string): number {
        const entry = this.limits.get(userId);
        if (!entry) return 0;

        const now = Date.now();
        if (now > entry.resetTime) return 0;

        return Math.ceil((entry.resetTime - now) / 1000);
    }
}

export const rateLimiter = new RateLimiter();
