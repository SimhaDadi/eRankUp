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
     * Clean AI response by removing artifacts and normalizing formatting
     * Handles LaTeX escaping, newlines, and unwanted characters
     */
    cleanAIResponse(text: string): string {
        if (!text) return text;

        let cleaned = text
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
}
