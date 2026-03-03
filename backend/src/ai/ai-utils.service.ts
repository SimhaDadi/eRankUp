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
        return text
            .replace(/\[INTERNAL_ONLY\][\s\S]*?\[\/INTERNAL_ONLY\]/gi, '')
            .replace(/\[HIDDEN\][\s\S]*?\[\/HIDDEN\]/gi, '')
            .replace(/\[THOUGHTS?\][\s\S]*?\[\/THOUGHTS?\]/gi, '')
            .replace(/\[REASONING\][\s\S]*?\[\/REASONING\]/gi, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
            .trim();
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

            // 1. Remove recursive "Re-checking" / "Incorrect" loops that leak outside tags
            // Pattern: [Something] -> [Something Else] -> [Another Thing] where it reflects internal struggle
            .replace(/(\s*->\s*(Actually|Wait|Incorrect|Re-checking|Correction|Mistake|Oops|Evaluation|Re-evaluation|Simplify):?\s*.*)+/gi, '')

            // 1.1 Remove recursive re-check phrases (seen in stuck loops)
            .replace(/(is incorrect,? recheck calculation[:\s]*)+/gi, '')
            .replace(/(is incorrect,? recheck[:\s]*)+/gi, '')
            .replace(/(incorrect,? recheck calculation[:\s]*)+/gi, '')
            .replace(/(recheck calculation[:\s]*)+/gi, '')
            .replace(/(re-?checking calculation[:\s]*)+/gi, '')
            .replace(/(is incorrect[:\s]*)+/gi, '')

            // 2. Remove meta-talk about the self-correction process
            .replace(/^(Actually|Wait|Incorrect|Re-checking|Correction|Mistake|Oops):?\s*/gi, '')
            .replace(/re-?checking calculation[:\s]*/gi, '')
            .replace(/re-?evaluating (the|given|provided) (options|data|calculation|answer)[:\s]*/gi, '')
            .replace(/not an option,? recheck calculation[:\s]*/gi, '')
            .replace(/indicates? a mistake in interpret(ing|ation)[:\s]*/gi, '')
            .replace(/mistake in interpretation[:\s]*/gi, '')
            .replace(/yields the actual error in interpretation[:\s]*/gi, '')
            .replace(/correct steps? is:[\s]*/gi, '')
            .replace(/no pre-computation or "Steps 1-9" allowed.?/gi, '')
            .replace(/follow this mathematical logic strictly.?/gi, '')

            // 3. Remove long chains of internal logic if they start with a trigger and are very long (heuristic)
            .replace(/([A-Z][^.!?]* (calculation|logic|evaluation) (again|considering|instead)[^.!?]*(\s*→\s*[^.!?]*){2,})/gi, '')

            // Normalize structure
            .replace(/\\n/g, '\n')
            // Fix LaTeX escaping (\\sqrt -> \sqrt)
            .replace(/\\\\([a-zA-Z]+)/g, '\\$1')
            // Fix LaTeX special characters
            .replace(/\\\\(\^|_|{|}|\\)/g, '\\$1')
            // Remove excessive newlines (3+ -> 2)
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        // 4. Line-level deduplication (catch looped AI behavior)
        const lines = cleaned.split('\n');
        const uniqueLines: string[] = [];
        let lastLine = '';

        for (const line of lines) {
            let trimmed = line.trim();
            if (!trimmed) {
                uniqueLines.push('');
                continue;
            }

            // 4.1 Internal line deduplication (e.g., "Result Result Result")
            // Catch repeated fragments of 5+ chars
            trimmed = trimmed.replace(/\b(.{5,})\s+\1\b/g, '$1');

            // If line is >80% similar to previous or exactly the same, skip it
            if (trimmed === lastLine || (lastLine && trimmed.includes(lastLine) && (trimmed.length < lastLine.length + 15))) {
                continue;
            }
            uniqueLines.push(trimmed);
            lastLine = trimmed;
        }

        return uniqueLines.join('\n').trim();
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
                if (trimmed.toUpperCase().startsWith('[HIDDEN]') || trimmed.toUpperCase().startsWith('<THINKING>')) {
                    insideHidden = true;
                } else if (trimmed.length > 25) {
                    // If we have > 25 chars and haven't matched hidden tags
                    yield buffer;
                    buffer = '';
                    hiddenBlockEnded = true;
                }
            }

            if (insideHidden) {
                // Look for closing tag
                // regex case insensitive check for [/HIDDEN] would be expensive in loop, using string search
                // Assuming AI output is consistent or we normalize. 
                // Let's use a case-insensitive match by converting window to upper
                const upperBuffer = buffer.toUpperCase();
                const closeIndex = upperBuffer.indexOf('[/HIDDEN]');
                const closeThinkingIndex = upperBuffer.indexOf('</THINKING>');

                const finalCloseIndex = closeIndex !== -1 ? closeIndex : closeThinkingIndex;
                const closeTagLen = closeIndex !== -1 ? 10 : 11; // [/HIDDEN] is 10, </THINKING> is 11

                if (finalCloseIndex !== -1) {
                    const remaining = buffer.substring(finalCloseIndex + closeTagLen);
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
