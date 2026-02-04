/**
 * Centralized polling manager to prevent multiple concurrent polling intervals
 * Reduces memory leaks and improves performance
 */

type PollingCallback = () => void | Promise<void>;

interface PollingRegistration {
    callback: PollingCallback;
    interval: number;
    intervalId: NodeJS.Timeout;
}

class PollingManager {
    private registrations = new Map<string, PollingRegistration>();

    /**
     * Register a new polling callback
     * @param key Unique identifier for this polling task
     * @param callback Function to call at each interval
     * @param interval Polling interval in milliseconds
     */
    register(key: string, callback: PollingCallback, interval: number) {
        // If already registered, skip
        if (this.registrations.has(key)) {
            console.warn(`Polling already registered for key: ${key}`);
            return;
        }

        const intervalId = setInterval(() => {
            try {
                callback();
            } catch (error) {
                console.error(`Error in polling callback for ${key}:`, error);
            }
        }, interval);

        this.registrations.set(key, {
            callback,
            interval,
            intervalId
        });
    }

    /**
     * Unregister and stop polling for a given key
     */
    unregister(key: string) {
        const registration = this.registrations.get(key);
        if (registration) {
            clearInterval(registration.intervalId);
            this.registrations.delete(key);
        }
    }

    /**
     * Update the interval for an existing registration
     */
    updateInterval(key: string, newInterval: number) {
        const registration = this.registrations.get(key);
        if (registration) {
            this.unregister(key);
            this.register(key, registration.callback, newInterval);
        }
    }

    /**
     * Get the number of active polling registrations
     */
    getActiveCount(): number {
        return this.registrations.size;
    }

    /**
     * Clear all polling registrations (useful for cleanup)
     */
    clearAll() {
        this.registrations.forEach((registration) => {
            clearInterval(registration.intervalId);
        });
        this.registrations.clear();
    }
}

// Singleton instance
export const pollingManager = new PollingManager();
