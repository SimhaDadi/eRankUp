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
    private readonly GROQ_DELAY = parseInt(this.configService.get('AI_DELAY_GROQ')) || 500;     // Default 0.5s
    private readonly MAX_QUEUE_SIZE = 300; // Security Cap to prevent OOM

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

    private async processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const rankedTask = this.queue.shift();

        if (rankedTask) {
            const { task, resolve, reject, priority, provider } = rankedTask;
            this.lastProviderUsed = provider;
            try {
                const result = await task();
                resolve(result);
            } catch (error) {
                console.error(`[AIQueueService] Task failed (Priority: ${priority}, Provider: ${provider}):`, error);
                reject(error);
            }
        }

        // Dynamic Rate Limit based on the PROVIDER THAT JUST FINISHED
        const delay = this.lastProviderUsed === 'groq' ? this.GROQ_DELAY : this.GEMINI_DELAY;

        if (this.queue.length > 0) {
            setTimeout(() => this.processQueue(), delay);
        } else {
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
