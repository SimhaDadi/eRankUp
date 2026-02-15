import { Injectable, Logger } from '@nestjs/common';

/**
 * Utility service for AI-related helper functions
 * Extracted to eliminate circular dependency between AIService and PromptBuilderService
 */
@Injectable()
export class AIUtilsService {
    private readonly logger = new Logger(AIUtilsService.name);

    /**
     * Sanitize user input to prevent prompt injection attacks
     * Removes malicious phrases and truncates long inputs
     */
    sanitizeInput(input: string): string {
        if (!input) return '';

        // List of malicious phrases to detect and remove
        const maliciousPhrases = [
            /ignore previous instructions/gi,
            /forget your previous/gi,
            /system prompt/gi,
            /developer mode/gi,
            /your instructions/gi,
            /acting as/gi,
            /you are a/gi,
            /pretend to be/gi,
            /roleplay as/gi,
            /new instructions/gi,
        ];

        let sanitized = input;

        // Remove malicious phrases
        maliciousPhrases.forEach(phrase => {
            if (sanitized.match(phrase)) {
                this.logger.warn(`Malicious input detected and removed: ${phrase}`);
                sanitized = sanitized.replace(phrase, '[REMOVED]');
            }
        });

        // Truncate if too long (prevent token overflow)
        if (sanitized.length > 3000) {
            sanitized = sanitized.substring(0, 3000) + '... [TRUNCATED]';
        }

        return sanitized;
    }

    /**
     * Remove HIDDEN thinking blocks from AI response
     */
    stripHidden(text: string): string {
        if (!text) return text;
        return text.replace(/\[HIDDEN\][\s\S]*?\[\/HIDDEN\]/gi, '').trim();
    }

    /**
     * Clean AI response by removing artifacts and normalizing formatting
     * Handles LaTeX escaping, newlines, and unwanted characters
     */
    cleanAIResponse(text: string): string {
        if (!text) return text;

        let cleaned = this.stripHidden(text)
            // Remove citation markers like 【0†source】
            .replace(/【[^】]*】/g, '')
            // Normalize newlines
            .replace(/\\n/g, '\n')
            // Fix LaTeX escaping (\\sqrt -> \sqrt)
            .replace(/\\\\([a-zA-Z]+)/g, '\\$1')
            // Fix LaTeX special characters
            .replace(/\\\\(\^|_|{|}|\\)/g, '\\$1')
            // Remove excessive newlines (3+ -> 2)
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return cleaned;
    }

    /**
     * Generator to clean streaming chunks by buffering [HIDDEN] block
     */
    async *cleanStreamChunk(input: AsyncIterableIterator<string>): AsyncIterableIterator<string> {
        let buffer = '';
        let hiddenBlockEnded = false;
        let insideHidden = false;

        for await (const chunk of input) {
            if (hiddenBlockEnded) {
                yield chunk;
                continue;
            }

            buffer += chunk;

            // Check if we are inside a hidden block
            if (!insideHidden) {
                const trimmed = buffer.trimStart();
                if (trimmed.toUpperCase().startsWith('[HIDDEN]')) {
                    insideHidden = true;
                } else if (trimmed.length > 20) {
                    // If we have > 20 chars and haven't matched [HIDDEN] (checked above),
                    // then it is NOT a hidden block, even if it starts with '['.
                    yield buffer;
                    buffer = '';
                    hiddenBlockEnded = true;
                }
                // If shorter than 20, we wait for more data to confirm if it becomes [HIDDEN]
            }

            if (insideHidden) {
                // Look for closing tag
                // regex case insensitive check for [/HIDDEN] would be expensive in loop, using string search
                // Assuming AI output is consistent or we normalize. 
                // Let's use a case-insensitive match by converting window to upper
                const upperBuffer = buffer.toUpperCase();
                const closeIndex = upperBuffer.indexOf('[/HIDDEN]');

                if (closeIndex !== -1) {
                    const remaining = buffer.substring(closeIndex + 10); // length of [/HIDDEN]
                    yield remaining;
                    buffer = '';
                    hiddenBlockEnded = true;
                    insideHidden = false;
                }
            }
        }

        // Flush remaining buffer if we never confirmed hidden block was closed or valid
        if (buffer && !insideHidden) {
            yield buffer;
        }
    }
}
