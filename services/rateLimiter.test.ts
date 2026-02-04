import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from './rateLimiter';

describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
        // Create a new rate limiter for each test
        // 1 second window, 3 requests max
        rateLimiter = new RateLimiter(1000, 3);
    });

    it('should allow requests within limit', () => {
        const userId = 'user-1';

        expect(rateLimiter.checkLimit(userId)).toBe(true);
        expect(rateLimiter.checkLimit(userId)).toBe(true);
        expect(rateLimiter.checkLimit(userId)).toBe(true);
    });

    it('should block requests exceeding limit', () => {
        const userId = 'user-1';

        // First 3 requests should pass
        rateLimiter.checkLimit(userId);
        rateLimiter.checkLimit(userId);
        rateLimiter.checkLimit(userId);

        // 4th request should be blocked
        expect(rateLimiter.checkLimit(userId)).toBe(false);
    });

    it('should track different users independently', () => {
        const user1 = 'user-1';
        const user2 = 'user-2';

        // User 1 makes 3 requests
        rateLimiter.checkLimit(user1);
        rateLimiter.checkLimit(user1);
        rateLimiter.checkLimit(user1);

        // User 1 should be blocked
        expect(rateLimiter.checkLimit(user1)).toBe(false);

        // User 2 should still be allowed
        expect(rateLimiter.checkLimit(user2)).toBe(true);
    });

    it('should return correct remaining requests', () => {
        const userId = 'user-1';

        expect(rateLimiter.getRemainingRequests(userId)).toBe(3);

        rateLimiter.checkLimit(userId);
        expect(rateLimiter.getRemainingRequests(userId)).toBe(2);

        rateLimiter.checkLimit(userId);
        expect(rateLimiter.getRemainingRequests(userId)).toBe(1);

        rateLimiter.checkLimit(userId);
        expect(rateLimiter.getRemainingRequests(userId)).toBe(0);
    });

    it('should reset limit for specific user', () => {
        const userId = 'user-1';

        // Exhaust limit
        rateLimiter.checkLimit(userId);
        rateLimiter.checkLimit(userId);
        rateLimiter.checkLimit(userId);

        expect(rateLimiter.checkLimit(userId)).toBe(false);

        // Reset
        rateLimiter.reset(userId);

        // Should be allowed again
        expect(rateLimiter.checkLimit(userId)).toBe(true);
    });

    it('should return correct reset time', () => {
        const userId = 'user-1';

        rateLimiter.checkLimit(userId);
        const resetTime = rateLimiter.getResetTime(userId);

        // Reset time should be around 1 second (within 100ms tolerance)
        expect(resetTime).toBeGreaterThan(0);
        expect(resetTime).toBeLessThanOrEqual(1);
    });

    it('should return stats', () => {
        rateLimiter.checkLimit('user-1');
        rateLimiter.checkLimit('user-2');

        const stats = rateLimiter.getStats();

        expect(stats.totalUsers).toBe(2);
        expect(stats.windowMs).toBe(1000);
        expect(stats.maxRequests).toBe(3);
    });

    it('should allow requests after window expires', async () => {
        const userId = 'user-1';

        // Exhaust limit
        rateLimiter.checkLimit(userId);
        rateLimiter.checkLimit(userId);
        rateLimiter.checkLimit(userId);

        expect(rateLimiter.checkLimit(userId)).toBe(false);

        // Wait for window to expire (1 second + buffer)
        await new Promise(resolve => setTimeout(resolve, 1100));

        // Should be allowed again
        expect(rateLimiter.checkLimit(userId)).toBe(true);
    });
});
