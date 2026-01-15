class RateLimiter {
    constructor(limit, interval) {
        this.limit = limit; // Maximum number of requests
        this.interval = interval; // Time period in milliseconds
        this.queue = []; // Queue to store request timestamps
    }

    isAllowed() {
        const now = Date.now();

        // Remove timestamps that are outside the current interval
        this.queue = this.queue.filter(timestamp => timestamp > now - this.interval);

        // Check if the limit has been reached
        if (this.queue.length < this.limit) {
            this.queue.push(now);
            return true;
        }

        return false;
    }
}

module.exports = RateLimiter;