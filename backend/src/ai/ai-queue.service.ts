
import { Injectable } from '@nestjs/common';

export enum AIPriority {
    HIGH = 'HIGH',    // Real-time chat, UI blocking tasks
    MEDIUM = 'MEDIUM', // Single question indexing, on-demand explanations
    LOW = 'LOW'       // Bulk uploads, background sync
}

interface RankedTask {
    task: () => Promise<any>;
    priority: AIPriority;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}

@Injectable()
export class AIQueueService {
    private queue: RankedTask[] = [];
    private isProcessing = false;
    private readonly RATE_LIMIT_DELAY = 1500; // Reduced to 1.5s (40 RPM) for better throughput

    async add<T>(task: () => Promise<T>, priority: AIPriority = AIPriority.MEDIUM): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const rankedTask: RankedTask = { task, priority, resolve, reject };

            this.queue.push(rankedTask);

            // Sort by priority (HIGH first)
            this.queue.sort((a, b) => {
                const priorityMap = { [AIPriority.HIGH]: 0, [AIPriority.MEDIUM]: 1, [AIPriority.LOW]: 2 };
                return priorityMap[a.priority] - priorityMap[b.priority];
            });

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
        const rankedTask = this.queue.shift();

        if (rankedTask) {
            const { task, resolve, reject, priority } = rankedTask;
            try {
                const result = await task();
                resolve(result);
            } catch (error) {
                console.error(`[AIQueueService] Task failed (Priority: ${priority}):`, error);
                reject(error);
            }
        }

        // Wait before next item. High priority might allow shorter cooldown in future.
        const delay = rankedTask?.priority === AIPriority.HIGH ? 500 : this.RATE_LIMIT_DELAY;

        if (this.queue.length > 0) {
            console.log(`[AIQueueService] Waiting ${delay}ms... (Queue: ${this.queue.length}, Next Priority: ${this.queue[0].priority})`);
            setTimeout(() => this.processQueue(), delay);
        } else {
            this.isProcessing = false;
        }
    }
}
