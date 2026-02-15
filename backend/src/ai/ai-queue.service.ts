import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum AIPriority {
    HIGH = 'HIGH',    // Real-time chat, UI blocking tasks
    MEDIUM = 'MEDIUM', // Single question indexing, on-demand explanations
    LOW = 'LOW'       // Bulk uploads, background sync
}

interface RankedTask {
    task: () => Promise<any>;
    priority: AIPriority;
    provider: 'gemini' | 'groq';
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}

@Injectable()
export class AIQueueService {
    private queue: RankedTask[] = [];
    private isProcessing = false;
    private lastProviderUsed: 'gemini' | 'groq' = 'gemini';
    private readonly GEMINI_DELAY = parseInt(this.configService.get('AI_DELAY_GEMINI')) || 6000; // Default 6s
    private readonly GROQ_DELAY = parseInt(this.configService.get('AI_DELAY_GROQ')) || 3000;     // Default 3s (20 RPM)
    private readonly MAX_QUEUE_SIZE = 300; // Security Cap
    private activeRequests = 0;
    private readonly MAX_CONCURRENT_REQUESTS = 5;

    constructor(private configService: ConfigService) { }

    async add<T>(
        task: () => Promise<T>,
        priority: AIPriority = AIPriority.MEDIUM,
        providerOverride?: 'gemini' | 'groq'
    ): Promise<T> {
        if (this.queue.length >= this.MAX_QUEUE_SIZE) {
            throw new ServiceUnavailableException('AI Service is under heavy load (Queue Full). Please try again in a minute.');
        }

        const provider = providerOverride || this.configService.get('AI_PROVIDER', 'gemini') as 'gemini' | 'groq';

        return new Promise<T>((resolve, reject) => {
            const rankedTask: RankedTask = { task, priority, provider, resolve, reject };

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

    /**
     * Acquires a slot in the queue and returns a release function.
     * Use this for streaming responses where the "task" duration is controlled by the caller.
     */
    async acquire(priority: AIPriority = AIPriority.MEDIUM, providerOverride?: 'gemini' | 'groq'): Promise<() => void> {
        return new Promise<() => void>((resolve) => {
            this.add(() => {
                return new Promise<void>((release) => {
                    resolve(() => release());
                });
            }, priority, providerOverride);
        });
    }

    private processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        // Throttle if too many active requests (Concurrency Limit)
        if (this.activeRequests >= this.MAX_CONCURRENT_REQUESTS) {
            setTimeout(() => this.processQueue(), 1000);
            return;
        }

        this.isProcessing = true;
        const rankedTask = this.queue.shift();

        if (rankedTask) {
            const { task, resolve, reject, priority, provider } = rankedTask;
            this.lastProviderUsed = provider;

            this.activeRequests++;
            // Execute WITHOUT awaiting (Pipeline)
            task()
                .then(resolve)
                .catch(error => {
                    console.error(`[AIQueueService] Task failed (Priority: ${priority}, Provider: ${provider}):`, error);
                    reject(error);
                })
                .finally(() => {
                    this.activeRequests--;
                });
        }

        // Dynamic Rate Limit - Schedule NEXT start
        // This ensures starts are spaced out by 'delay' ms
        const delay = this.lastProviderUsed === 'groq' ? this.GROQ_DELAY : this.GEMINI_DELAY;

        // Ensure loop continues if there are items
        if (this.queue.length > 0) {
            setTimeout(() => this.processQueue(), delay);
        } else {
            // We set isProcessing to false, but if a task is still running, that's fine.
            // When a NEW task comes in, add() will see isProcessing=false and restart calls.
            // BUT there's a race: if we set false now, add() might start immediately.
            // That's actually okay, because processQueue checks activeRequests.
            // However, we should only set false if we are not scheduling a timeout.
            this.isProcessing = false;
        }
    }

    getStats() {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            lastProvider: this.lastProviderUsed,
            maxQueueSize: this.MAX_QUEUE_SIZE
        };
    }
}
