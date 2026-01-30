
import { Injectable } from '@nestjs/common';

@Injectable()
export class AIQueueService {
    private queue: Array<() => Promise<any>> = [];
    private isProcessing = false;
    private readonly RATE_LIMIT_DELAY = 2500; // 2.5 seconds between requests (24 RPM)

    /**
     * Add a task to the AI queue
     * @param task A function that returns a promise (the API call)
     * @returns The result of the task promise
     */
    async add<T>(task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const wrappedTask = async () => {
                try {
                    const result = await task();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            this.queue.push(wrappedTask);
            if (!this.isProcessing) {
                this.processQueue();
            }
        });
    }

    private async processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const task = this.queue.shift();

        if (task) {
            try {
                await task();
            } catch (error) {
                console.error('[AIQueueService] Task failed:', error);
            }
        }

        // Wait before processing next item to enforce rate limit
        console.log(`[AIQueueService] Waiting ${this.RATE_LIMIT_DELAY}ms before next request... (Queue size: ${this.queue.length})`);
        setTimeout(() => {
            this.processQueue();
        }, this.RATE_LIMIT_DELAY);
    }
}
