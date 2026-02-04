/**
 * Rate Limiter for PromptMaster Enterprise
 * 
 * Following Stripe/Google API standards:
 * - Sliding window algorithm
 * - Per-user limits
 * - Graceful degradation
 * - Clear error messages
 */

interface RateLimitEntry {
    timestamps: number[];
    lastCleanup: number;
}

class RateLimiter {
    private limits: Map<string, RateLimitEntry>;
    private readonly windowMs: number;
    private readonly maxRequests: number;
    private readonly cleanupIntervalMs: number;

    constructor(
        windowMs: number = 60000, // 1 minute
        maxRequests: number = 5,
        cleanupIntervalMs: number = 300000 // 5 minutes
    ) {
        this.limits = new Map();
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.cleanupIntervalMs = cleanupIntervalMs;

        // Periodic cleanup of old entries
        setInterval(() => this.cleanup(), this.cleanupIntervalMs);
    }

    /**
     * Check if user has exceeded rate limit
     * @param userId User identifier
     * @returns true if within limit, false if exceeded
     */
    checkLimit(userId: string): boolean {
        const now = Date.now();
        const entry = this.limits.get(userId);

        if (!entry) {
            // First request from this user
            this.limits.set(userId, {
                timestamps: [now],
                lastCleanup: now
            });
            return true;
        }

        // Remove timestamps outside the window
        const validTimestamps = entry.timestamps.filter(
            (ts) => now - ts < this.windowMs
        );

        if (validTimestamps.length >= this.maxRequests) {
            // Rate limit exceeded
            return false;
        }

        // Add current timestamp
        validTimestamps.push(now);
        this.limits.set(userId, {
            timestamps: validTimestamps,
            lastCleanup: now
        });

        return true;
    }

    /**
     * Get remaining requests for a user
     * @param userId User identifier
     * @returns number of remaining requests
     */
    getRemainingRequests(userId: string): number {
        const now = Date.now();
        const entry = this.limits.get(userId);

        if (!entry) {
            return this.maxRequests;
        }

        const validTimestamps = entry.timestamps.filter(
            (ts) => now - ts < this.windowMs
        );

        return Math.max(0, this.maxRequests - validTimestamps.length);
    }

    /**
     * Get time until rate limit resets (in seconds)
     * @param userId User identifier
     * @returns seconds until reset, or 0 if not limited
     */
    getResetTime(userId: string): number {
        const entry = this.limits.get(userId);

        if (!entry || entry.timestamps.length === 0) {
            return 0;
        }

        const oldestTimestamp = Math.min(...entry.timestamps);
        const resetTime = oldestTimestamp + this.windowMs;
        const now = Date.now();

        return Math.max(0, Math.ceil((resetTime - now) / 1000));
    }

    /**
     * Reset rate limit for a specific user
     * @param userId User identifier
     */
    reset(userId: string): void {
        this.limits.delete(userId);
    }

    /**
     * Cleanup old entries to prevent memory leaks
     */
    private cleanup(): void {
        const now = Date.now();
        const entriesToDelete: string[] = [];

        this.limits.forEach((entry, userId) => {
            // Remove entries that haven't been accessed in 2x cleanup interval
            if (now - entry.lastCleanup > this.cleanupIntervalMs * 2) {
                entriesToDelete.push(userId);
            }
        });

        entriesToDelete.forEach((userId) => this.limits.delete(userId));
    }

    /**
     * Get current stats (for monitoring)
     */
    getStats(): {
        totalUsers: number;
        windowMs: number;
        maxRequests: number;
    } {
        return {
            totalUsers: this.limits.size,
            windowMs: this.windowMs,
            maxRequests: this.maxRequests
        };
    }
}

// Export singleton instance
export const rateLimiter = new RateLimiter(
    60000, // 1 minute window
    5      // 5 requests per minute
);

// Export class for testing
export { RateLimiter };
