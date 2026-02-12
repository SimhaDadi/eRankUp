import { Injectable, Logger } from '@nestjs/common';
import { Question } from '../exams/entities/question.entity';
import { AIChatMessage } from '../ai-chat/entities/chat-message.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
    ExplanationPromptOptions,
    ChatPromptOptions,
    QuestionImage,
    WeakArea,
} from './interfaces/prompt-builder.interfaces';
import { AIUtilsService } from './ai-utils.service';
import {
    InvalidPromptInputException,
    MissingPromptParameterException,
} from './exceptions/prompt-validation.exception';
import { PROMPTS_CONFIG } from './config/prompts.config';
const fileType = require('file-type');
const LRUCache = require('lru-cache');

@Injectable()
export class PromptBuilderService {
    private readonly logger = new Logger(PromptBuilderService.name);
    private readonly imageCache: any;

    constructor(
        private readonly aiUtils: AIUtilsService,
    ) {
        this.imageCache = new LRUCache({
            max: 100,
            ttl: 1000 * 60 * 60,
        });
    }

    /**
     * Build comprehensive explanation prompt with subject-specific formatting
     * Used by ExplanationService
     */
    buildExplanationPrompt(options: ExplanationPromptOptions): string {
        // Validate input
        this.validateExplanationPromptOptions(options);

        const { question, userAnswer, contextExamTitle, subject } = options;

        const examContext = contextExamTitle || question.exam?.title || question.exams?.[0]?.title || 'Indian competitive exams (SSC CGL, RRB NTPC, Banking)';
        const subjectTitle = subject || question.subject?.title || 'General Aptitude';
        const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
        const userOption = userAnswer ? question.options.find(opt => opt.id === userAnswer) : null;

        // --- Subject-Specific Logic ---
        const subjectLower = subjectTitle.toLowerCase();
        let personaInstructions = '';
        let step1Title = PROMPTS_CONFIG.subjects.quantReasoning.steps.step1.title;
        let step2Title = PROMPTS_CONFIG.subjects.quantReasoning.steps.step2.title;
        let step1Desc = PROMPTS_CONFIG.subjects.quantReasoning.steps.step1.description;
        let step2Desc = PROMPTS_CONFIG.subjects.quantReasoning.steps.step2.description;

        // CASE 1: English Language
        if (PROMPTS_CONFIG.subjects.english.keywords.some(k => subjectLower.includes(k))) {
            const config = PROMPTS_CONFIG.subjects.english;
            personaInstructions = config.persona;
            step1Title = config.steps.step1.title;
            step2Title = config.steps.step2.title;
            step1Desc = config.steps.step1.description;
            step2Desc = config.steps.step2.description;
        }
        // CASE 2: General Awareness / GS (History, Geo, Polity, etc)
        else if (
            (subjectLower.includes('general') &&
                !PROMPTS_CONFIG.subjects.generalStudies.excludeKeywords.some(k => subjectLower.includes(k))
            ) ||
            PROMPTS_CONFIG.subjects.generalStudies.keywords.some(k => subjectLower.includes(k))
        ) {
            const config = PROMPTS_CONFIG.subjects.generalStudies;
            personaInstructions = config.persona;
            step1Title = config.steps.step1.title;
            step2Title = config.steps.step2.title;
            step1Desc = config.steps.step1.description;
            step2Desc = config.steps.step2.description;
        }
        // CASE 3: Quant / Reasoning (Default)
        else {
            personaInstructions = this.getQuantPersonaInstructions();
        }

        let prompt = `${personaInstructions}
  
  ### SYLLABUS GUARDRAILS (STRICT):
  Your scope is STRICTLY limited to the syllabus of ${PROMPTS_CONFIG.syllabusGuardrails.scope}.
  
  If the question is:
  1. Highly academic/research-level (PhD/Masters depth) irrelevant to objective exams.
  2. A subjective opinion, political debate, or essay request.
  3. Irrelevant to the standard objective exam format (e.g. "tell me a joke").
  4. Asking for personal/medical/legal advice.

  THEN REFUSE to answer and output exactly:
  "${PROMPTS_CONFIG.syllabusGuardrails.refusalMessage}"
  
  ### Context
  - **Subject**: ${subjectTitle}
  - **Topic**: ${question.topic}${question.chapter ? ` - ${question.chapter.title}` : ''}
  - **Question**: 
  [USER_DATA_START]
  ${this.sanitizeInput(question.content)}
  [USER_DATA_END]
  
  - **Options**:
  ${question.options.map(opt => `${opt.id}) ${this.sanitizeInput(opt.text)}`).join('\n')}
  - **Correct Answer**: ${question.correctOptionId}) ${correctOption?.text}
  
  ### Relevant Shortcut Hint
  ${this.getShortcutHint(subjectTitle, question.topic || '')}
  
  ### Math Verification Rule
  ${PROMPTS_CONFIG.syllabusGuardrails.mathVerification}
  `;

        if (userAnswer && userAnswer !== question.correctOptionId) {
            prompt += `- **Student's Wrong Choice**: ${userAnswer}) ${this.sanitizeInput(userOption?.text || '')}\n`;
        }

        prompt += `
  ### Instructions for the Explanation
  Write a concise, high-impact "Cheat Sheet" style explanation.
  **STRICT RULE**: START IMMEDIATELY with the steps below. NO introductory text, NO concept overview, NO algebra.
  
  **${step1Title}** 🚀
  - ${step1Desc}
  
  **${step2Title}** 🔥
  - ${step2Desc}
  
  ---
  **CRITICAL SECURITY INSTRUCTION**: ${PROMPTS_CONFIG.security.criticalInstruction}`;

        return prompt;
    }

    /**
     * Build personalized chat prompt with conversation context
     * Used by AIChatService
     */
    buildChatPrompt(options: ChatPromptOptions): string {
        // Validate input
        this.validateChatPromptOptions(options);

        const { message, context, history } = options;

        const weakAreasText = context.weakAreas.length > 0
            ? context.weakAreas.map((w: any) => `${w.topic} (${Math.round(w.mastery * 100)}%)`).join(', ')
            : 'None';

        let questionPrompt = '';
        if (context.questionContext) {
            const qc = context.questionContext;
            const perf = qc.userPerformance;
            const performanceHint = perf ? `
### STUDENT ACTION
- Selected: ${perf.selectedOption} (${perf.isCorrect ? 'Correct' : 'WRONG'})
- Time Taken: ${perf.timeSpentSeconds}s (Topper Avg: ${qc.avgTopperTime}s)
` : '';

            questionPrompt = `
### ACTIVE QUESTION
Q: ${qc.content}
Options: ${qc.options}
Correct Ans: ${qc.correctOption}
Official Explanation: ${qc.officialExplanation}
${performanceHint}
`;
        }

        const historyText = history.slice(-6).map(m => `${m.role === 'user' ? 'Student' : 'Faculty'}: ${m.content}`).join('\n');

        return `${PROMPTS_CONFIG.chat.tutorIdentity}

CONTEXT:
Weak Topics: ${weakAreasText}
Language: ${context.preferredLanguage}

${questionPrompt}

HISTORY:
${historyText}

 INSTRUCTIONS:
${PROMPTS_CONFIG.chat.instructions.map((ins, idx) => ` ${idx + 1}. ${ins}`).join('\n')}

GOAL: Provide a 30-second shortcut that allows a student to solve and move to the next question immediately.
  **STRICT START**: Answer the student's message IMMEDIATELY. NO pre-response commentary or welcoming.

Student: ${message}
Tutor:`;
    }

    /**
     * Build minimal "cheat sheet" style prompt
     * Used by AIService.generateQuestionExplanation()
     */
    buildQuickExplanationPrompt(question: Question): string {
        // Validate input
        this.validateQuickExplanationInput(question);

        const optionsText = question.options
            .map((opt: any) => `${opt.id}. ${this.sanitizeInput(opt.text)}`)
            .join('\n');

        const correctOption = question.options.find((opt: any) => opt.id === question.correctOptionId);

        return `${PROMPTS_CONFIG.subjects.quantReasoning.persona}
        
        GOAL: Provide a "Cheat Sheet" style solution in maximum 3 steps.
        CONSTRAINT: Use LaTeX for all mathematical expressions. Wrap inline math in $...$ (e.g., $x^2$) and block math in $$...$$.
        
        [GOOD RESPONSE FORMAT]
        💡 CORE: Identify the main concept in one line.
        🚀 ${PROMPTS_CONFIG.subjects.quantReasoning.steps.step1.title.split('. ')[1].toUpperCase()}:
        1. Step one (mental math/logic)
        2. Step two
        3. Step three (Result)
        🔥 ${PROMPTS_CONFIG.subjects.quantReasoning.steps.step2.title.split('. ')[1].toUpperCase()}: 15-second "Ranker's" tip.

        Question Content:
        ${this.sanitizeInput(question.content)}
 
        Options:
        ${optionsText}
 
        Correct Answer: ${question.correctOptionId} - ${this.sanitizeInput(correctOption?.text || 'N/A')}
 
        GENERATE EXPLANATION FOLLOWING THE [GOOD RESPONSE FORMAT] STRICTLY:`;
    }

    /**
     * Load question image from filesystem (async)
     * Shared utility for loading diagrams
     */
    async loadQuestionImage(imageUrl: string | null | undefined): Promise<QuestionImage | null> {
        if (!imageUrl || !imageUrl.startsWith('/uploads')) {
            return null;
        }

        // Check cache
        const cached = this.imageCache.get(imageUrl);
        if (cached) {
            this.logger.debug('Image cache hit', { imageUrl });
            return cached;
        }

        try {
            const absolutePath = path.join(process.cwd(), imageUrl);


            // Security: Prevent directory traversal
            const normalizedPath = path.normalize(absolutePath);
            if (!normalizedPath.startsWith(process.cwd())) {
                this.logger.warn('Attempted directory traversal', { imageUrl });
                throw new Error('Invalid file path');
            }

            // Check if file exists (async)
            await fs.access(absolutePath);

            // Read file asynchronously
            const buffer = await fs.readFile(absolutePath);

            const result = {
                data: buffer.toString('base64'),
                mimeType: await this.detectMimeType(buffer, imageUrl),
            };

            // Store in cache
            this.imageCache.set(imageUrl, result);

            return result;
        } catch (e) {
            this.logger.error('Failed to load question image', {
                imageUrl,
                error: e.message,
            });
            return null;
        }
    }

    /**
     * Sanitize user input to prevent prompt injection
     * Delegates to AIService for consistency
     */
    sanitizeInput(input: string): string {
        return this.aiUtils.sanitizeInput(input);
    }

    /**
     * Get comprehensive Quant/Reasoning persona instructions
     * Private helper method
     */
    private getQuantPersonaInstructions(): string {
        return `${PROMPTS_CONFIG.subjects.quantReasoning.persona}
  
  ### CONSTRAINTS (MANDATORY):
  1. **ABSOLUTE BREVITY**: Avoid full sentences. Use arrows ($\\rightarrow$) for logical transitions. 
  2. **LEAD WITH FORMULA / TRICK**: 
     - **Time & Work**: Lead with $x = \\sqrt{ab}$ patterns.
     - **Percentages**: Lead with **Alligation Method** or **Fraction Table** (e.g., $16.66\\% = 1/6$).
     - **Profit & Loss**: Lead with **Successive Formula** ($a+b+\\frac{ab}{100}$), **Ratio Method** ($CP:SP$), or **Dishonest Dealer** trick.
     - **Ratio & Proportion**: Lead with **Direct Option Checking** (check if options satisfy ratio) or **LCM Method** (for merging).
     - **Time & Distance**: Lead with **Ratio Method** ($S \\propto 1/T$) or **Relative Speed** logic.
     - **Mensuration**: Lead with **Divisibility Rule of 11** (for $\\pi$) or **Scaling Factor** ($A \\propto r^2$).
     - **Number Theory**: Lead with **Divisibility Rules** (Sum of digits for 3/9), **Unit Digit** logic, or **Remainder Theorem**.
     - **SI & CI**: Lead with **Effective % Method** ($x+y+\\frac{xy}{100}$ for 2 years) or **Tree Method**.
     - **Algebra**: Lead with **Value Substitution** (e.g., Put $x=1, y=0$), **Symmetry**, or **Degree Check** immediately.
     - **Geometry**: Lead with **Pythagorean Triplets** (3-4-5, 5-12-13), **Direct Theorem** (e.g., Angle at Center = $2\\theta$), or **Triplet Check**.
     - **Trigonometry**: Lead with **Value Logic** (Put $\\theta=0^\\circ, 30^\\circ, 45^\\circ$) or **Triplet Application**.
     - **Averages**: Lead with **Deviation Method**.
  3. **MANDATE LaTeX**: Wrap ALL math in $ ... $. Use LaTeX for visual beauty (\\frac, \\sqrt, etc.).
  4. **MAX 3 STEPS**: Strictly limit the strategy to 3 concise bullet points.
   5. **STRICTLY FORBIDDEN - NO ALGEBRA**:
     ❌ NEVER write: "Let x be...", "Assume...", "$x = \\sqrt{(x+8)(x+18)}$", "$\\frac{1}{x} = \\frac{1}{a} + \\frac{1}{b}$"
     ❌ NEVER use variables in formulas. Use DIRECT NUMBERS ONLY.
     ✅ ALWAYS write: "$x = \\sqrt{8 \\times 18} = 12$ days" (direct calculation with numbers)
     
  ### EXAMPLE (Time & Work):
  ❌ WRONG FORMAT (Algebraic):
  * $x = \\sqrt{(x + 8)(x + 18)}$
  * $\\frac{1}{x} = \\frac{1}{x + 8} + \\frac{1}{x + 18}$
  * Solve for x
  
  ✅ CORRECT FORMAT (Direct Shortcut):
  * Pattern: $x = \\sqrt{8 \\times 18} = \\sqrt{144} = 12$ days
  * Task: $\\frac{5}{6}$ work $\\rightarrow \\frac{5}{6} \\times 12 = 10$ days
  
  YOU MUST FOLLOW THE ✅ CORRECT FORMAT. The ❌ WRONG FORMAT is ABSOLUTELY FORBIDDEN.`;
    }

    /**
     * Detect MIME type from file extension
     * Private helper method
     */
    private async detectMimeType(buffer: Buffer, filePath: string): Promise<string> {
        try {
            const type = await fileType.fromBuffer(buffer);
            if (type) {
                return type.mime;
            }
        } catch (e) {
            this.logger.warn('Failed to detect MIME type from buffer', { filePath });
        }

        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.bmp': 'image/bmp',
            '.svg': 'image/svg+xml',
        };
        return mimeTypes[ext] || 'image/jpeg';
    }

    /**
     * Validate explanation prompt options
     * @private
     */
    private validateExplanationPromptOptions(options: ExplanationPromptOptions): void {
        if (!options) {
            throw new MissingPromptParameterException('options');
        }

        if (!options.question) {
            throw new MissingPromptParameterException('question');
        }

        const { question } = options;

        if (!question.content || typeof question.content !== 'string' || question.content.trim().length === 0) {
            throw new InvalidPromptInputException('question.content', 'must be a non-empty string');
        }

        if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
            throw new InvalidPromptInputException('question.options', 'must be a non-empty array');
        }

        if (!question.correctOptionId || typeof question.correctOptionId !== 'string') {
            throw new InvalidPromptInputException('question.correctOptionId', 'must be a valid string');
        }

        // Validate that correctOptionId exists in options
        const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
        if (!correctOption) {
            throw new InvalidPromptInputException(
                'question.correctOptionId',
                `'${question.correctOptionId}' does not match any option ID`
            );
        }

        // Validate userAnswer if provided
        if (options.userAnswer) {
            const userOption = question.options.find(opt => opt.id === options.userAnswer);
            if (!userOption) {
                throw new InvalidPromptInputException(
                    'userAnswer',
                    `'${options.userAnswer}' does not match any option ID`
                );
            }
        }
    }

    /**
     * Validate chat prompt options
     * @private
     */
    private validateChatPromptOptions(options: ChatPromptOptions): void {
        if (!options) {
            throw new MissingPromptParameterException('options');
        }

        if (!options.message || typeof options.message !== 'string' || options.message.trim().length === 0) {
            throw new InvalidPromptInputException('message', 'must be a non-empty string');
        }

        if (options.message.length > 5000) {
            throw new InvalidPromptInputException('message', 'exceeds maximum length of 5000 characters');
        }

        if (!options.context) {
            throw new MissingPromptParameterException('context');
        }

        if (!Array.isArray(options.context.weakAreas)) {
            throw new InvalidPromptInputException('context.weakAreas', 'must be an array');
        }

        if (!Array.isArray(options.history)) {
            throw new InvalidPromptInputException('history', 'must be an array');
        }
    }

    /**
     * Validate quick explanation prompt input
     * @private
     */
    private validateQuickExplanationInput(question: Question): void {
        if (!question) {
            throw new MissingPromptParameterException('question');
        }

        if (!question.content || typeof question.content !== 'string' || question.content.trim().length === 0) {
            throw new InvalidPromptInputException('question.content', 'must be a non-empty string');
        }

        if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
            throw new InvalidPromptInputException('question.options', 'must be a non-empty array');
        }

        if (!question.correctOptionId || typeof question.correctOptionId !== 'string') {
            throw new InvalidPromptInputException('question.correctOptionId', 'must be a valid string');
        }
    }

    /**
     * Get relevant shortcut hint based on subject and topic
     * @private
     */
    private getShortcutHint(subject: string, topic: string): string {
        const subLower = subject.toLowerCase();
        const topLower = topic.toLowerCase();
        const shortcuts = PROMPTS_CONFIG.subjects.quantReasoning.shortcuts;

        if (subLower.includes('quant') || subLower.includes('math') || subLower.includes('reasoning') || subLower.includes('aptitude')) {
            for (const [key, value] of Object.entries(shortcuts)) {
                if (topLower.includes(key)) {
                    return `HINT: Use the following pattern if applicable: ${value}`;
                }
            }
        }
        return 'HINT: Focus on pattern recognition and extreme shortcuts. NO algebraic steps.';
    }
}
