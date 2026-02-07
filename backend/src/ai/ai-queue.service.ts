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
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}

@Injectable()
export class AIQueueService {
    private queue: RankedTask[] = [];
    private isProcessing = false;
    private readonly GEMINI_DELAY = 6000; // 6s (10 RPM) for Gemini Free Tier
    private readonly GROQ_DELAY = 500;   // 0.5s for Groq (Fast Inference)
    private readonly MAX_QUEUE_SIZE = 300; // Security Cap to prevent OOM

    constructor(private configService: ConfigService) { }

    async add<T>(task: () => Promise<T>, priority: AIPriority = AIPriority.MEDIUM): Promise<T> {
        if (this.queue.length >= this.MAX_QUEUE_SIZE) {
            throw new ServiceUnavailableException('AI Service is under heavy load (Queue Full). Please try again in a minute.');
        }

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

        // Dynamic Rate Limit
        const provider = this.configService.get('AI_PROVIDER', 'gemini');
        const delay = provider === 'groq' ? this.GROQ_DELAY : this.GEMINI_DELAY;

        if (this.queue.length > 0) {
            // console.log(`[AIQueueService] Waiting ${delay}ms... (Queue: ${this.queue.length}, Next Priority: ${this.queue[0].priority})`);
            setTimeout(() => this.processQueue(), delay);
        } else {
            this.isProcessing = false;
        }
    }
}
