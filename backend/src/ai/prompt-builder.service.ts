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
            // Pass the topic to get specific constraints
            personaInstructions = this.getQuantPersonaInstructions(question.topic);
        }

        // --- Secondary Verification Context ---
        let verificationContext = '';
        if (options.verifiedSolve) {
            const isMatch = options.verifiedSolve.solvedOptionId === question.correctOptionId;
            verificationContext = `
  ### INDEPENDENT LOGIC VERIFICATION:
  - **Status**: ${isMatch ? 'VERIFIED' : 'CONFLICT DETECTED'}
  - **Internal Solve Result**: Option ${options.verifiedSolve.solvedOptionId}
  - **Logic Hint**: ${options.verifiedSolve.logic}
  - **Instruction**: ${isMatch
                    ? "Ensure the final explanation strictly follows this verified logic."
                    : `There is a conflict between the stored answer key (${question.correctOptionId}) and the logical solve (${options.verifiedSolve.solvedOptionId}). PRIORITIZE mathematical truth. If the stored option is logically impossible, explain the correct way clearly but lead with why ${question.correctOptionId} might be chosen (or flag the error).`}
  `;
        }

        let prompt = `${personaInstructions}
  ${verificationContext}
  
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
  - **Subject**: ${subjectTitle || 'General Studies'}
  - **Topic**: ${question.topic || 'General'}${question.chapter ? ` - ${question.chapter.title || 'General'}` : ''}
  - **Question**: 
  [USER_DATA_START]
  ${this.sanitizeInput(question.content || '')}
  [USER_DATA_END]
  
  - **Options**:
  ${(question.options || []).map(opt => `${opt.id}) ${this.sanitizeInput(opt.text || '')}`).join('\n')}
  - **Correct Answer**: ${question.correctOptionId || 'N/A'}) ${correctOption?.text || 'Correct option data missing'}
  
  ### Relevant Shortcut Hint
  ${this.getShortcutHint(subjectTitle || 'General', question.topic || '')}
  `;

        if (userAnswer && userAnswer !== question.correctOptionId) {
            prompt += `- **Student's Wrong Choice**: ${userAnswer}) ${this.sanitizeInput(userOption?.text || '')}\n`;
        }

        prompt += `
  [HIDDEN THINKING INSTRUCTION]
  You MUST first plan your logic inside a '[HIDDEN]' ... '[/HIDDEN]' block. 
  - Analyze the question step-by-step here to ensure accuracy.
  - ${PROMPTS_CONFIG.syllabusGuardrails.mathVerification}
  - Verify your logic before committing to the final answer.
  - This block will NOT be seen by the student.

  ### NEGATIVE CONSTRAINTS (FOR VISIBLE OUTPUT):
  - Do NOT include internal deliberation phrases like "Wait...", "Actually...", "Incorrect...", or "Re-checking...".
  - If you find an error during hidden thinking, fix it BEFORE writing the final response.
  - The final response must be confident and lead with the solution.

  [MANDATORY FORMAT - YOU MUST INCLUDE ALL SECTIONS BELOW]
  
  **${step1Title}** 🚀
  - ${step1Desc}
  
  **${step2Title}** 🔥
  - ${step2Desc}
  
  **CRITICAL**: The 🔥 ${step2Title} section is MANDATORY and NON-NEGOTIABLE. You MUST provide a quick mental trick, mnemonic, or 15-second shortcut tip.
  
  EXAMPLE (for Quant/Reasoning):
  **1. Extreme Shortcut Solution** 🚀
  - Given ratio $108:132 = 9:11$ (divide by 12)
  - Broken: $\\frac{1}{3} \\times 108 + \\frac{1}{4} \\times 132 = 36 + 33 = 69$
  - Usable: $240 - 69 = 171$ → $171/90 = 1.9$ per person → 90 people
  
  **2. Ranker's Hack** 🔥
  - For "broken items" problems, always calculate total first, then subtract. Check if final answer divides evenly into the total.
  
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

        // Inject topic-specific hint if available
        let shortcutHint = '';
        if (context.questionContext && context.questionContext.topic) {
            // Look for relevant shortcut in PROMPTS_CONFIG
            // We can reuse getShortcutHint logic or duplicate it slightly for simplicity
            const topicLower = context.questionContext.topic.toLowerCase();
            const sc = PROMPTS_CONFIG.subjects.quantReasoning.shortcuts;
            for (const [key, val] of Object.entries(sc)) {
                if (topicLower.includes(key)) {
                    shortcutHint = `\nRELEVANT PATTERN FOR ${context.questionContext.topic.toUpperCase()}: ${val}\n`;
                    break;
                }
            }
        }



        // Determine Subject Config for Persona & Instructions
        let subjectConfig = PROMPTS_CONFIG.subjects.quantReasoning; // Default
        const topicLower = context.questionContext?.topic?.toLowerCase() || '';
        const messageLower = message.toLowerCase();

        // Simple keyword matching to guess subject if not explicitly provided
        if (PROMPTS_CONFIG.subjects.english.keywords.some(k => topicLower.includes(k) || messageLower.includes(k))) {
            subjectConfig = PROMPTS_CONFIG.subjects.english as any;
        } else if (PROMPTS_CONFIG.subjects.generalStudies.keywords.some(k => topicLower.includes(k) || messageLower.includes(k))) {
            subjectConfig = PROMPTS_CONFIG.subjects.generalStudies as any;
        }

        let instructions = [...PROMPTS_CONFIG.chat.instructions];

        // Customize instructions based on subject
        if (subjectConfig === PROMPTS_CONFIG.subjects.english as any) {
            instructions = instructions.map(ins => {
                if (ins.includes('EXTREME SHORTCUT MODE')) return `**GRAMMAR/VOCAB SHORTCUT**: Explain the rule in 1 line. No lengthy definitions.`;
                if (ins.includes('PREFERRED METHOD')) return `**PREFERRED METHOD**: Use Root Words, Mnemonic hooks, or direct Grammar Rule citations.`;
                if (ins.includes('FORBID ALGEBRA')) return `**NO JARGON**: Avoid complex linguistic terms unless necessary for the rule.`;
                return ins;
            });
        } else if (subjectConfig === PROMPTS_CONFIG.subjects.generalStudies as any) {
            instructions = instructions.map(ins => {
                if (ins.includes('EXTREME SHORTCUT MODE')) return `**MEMORY HACK MODE**: Provide the direct answer + a mnemonic/story to remember it.`;
                if (ins.includes('PREFERRED METHOD')) return `**PREFERRED METHOD**: Use Acronyms, Funny associations, or standard Fact-Links.`;
                if (ins.includes('FORBID ALGEBRA')) return `**NO FLUFF**: Do not give background history unless it helps memory.`;
                return ins;
            });
        }

        // DYNAMIC OVERRIDE: Check Topic Metadata AND Content for Direction keywords
        const directionKeywords = ['north', 'south', 'east', 'west', 'walks', 'turns left', 'turns right'];
        const isDirectionProblem = topicLower.includes('direction') || directionKeywords.some(k => messageLower.includes(k) || (context.questionContext?.content || '').toLowerCase().includes(k));

        if (isDirectionProblem) {
            instructions = instructions.map(ins => {
                if (ins.includes('EXTREME SHORTCUT MODE')) return '**CANCELLATION SHORTCUT**: Sum North vs South, East vs West. Cancel them out. Final distance calculated in 1 line.';
                if (ins.includes('NEGATIVE CONSTRAINT')) return '**AVOID DIAGRAMS**: Use the N-E-S-W writing method to solve mentally.';
                return ins;
            });
            // Force the explicit method block
            instructions.push(`[MANDATORY METHOD]: Use the **N-E-S-W Cancellation Trick**.
            1. Write N, E, S, W in a row.
            2. Sum distances under each specific direction.
            3. Subtract Opposites (Net North-South, Net East-West).
            4. Result = $\\sqrt{(Net NS)^2 + (Net EW)^2}$.
            ❌ DO NOT DRAW A DIAGRAM. USE THIS ALGEBRAIC SHORTCUT ONLY.`);
        }

        return `${subjectConfig.persona}

CONTEXT:
Weak Topics: ${weakAreasText}
Language: ${context.preferredLanguage}
${shortcutHint}

${questionPrompt}

HISTORY:
${historyText}

 INSTRUCTIONS:
${instructions.map((ins, idx) => ` ${idx + 1}. ${ins}`).join('\n')}

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

        // Determine Subject Config
        const subjectText = (question.subject?.title || question.topic || 'General').toLowerCase();
        let subjectConfig = PROMPTS_CONFIG.subjects.quantReasoning; // Default

        if (PROMPTS_CONFIG.subjects.english.keywords.some(k => subjectText.includes(k))) {
            subjectConfig = PROMPTS_CONFIG.subjects.english as any;
        } else if (PROMPTS_CONFIG.subjects.generalStudies.keywords.some(k => subjectText.includes(k))) {
            subjectConfig = PROMPTS_CONFIG.subjects.generalStudies as any;
        }

        // DYNAMIC OVERRIDE: Check Content for Direction keywords
        const contentLower = question.content.toLowerCase();
        const directionKeywords = ['north', 'south', 'east', 'west', 'walks', 'turns left', 'turns right'];
        const isDirectionProblem = subjectText.includes('direction') || directionKeywords.some(k => contentLower.includes(k));

        let specificShortcutInstruction = '';
        if (isDirectionProblem) {
            specificShortcutInstruction = `
        [MANDATORY METHOD]: Use the **N-E-S-W Cancellation Trick**.
        1. Write N, E, S, W in a row.
        2. Sum distances under each specific direction.
        3. Subtract Opposites (Net North-South, Net East-West).
        4. Result = $\\sqrt{(Net NS)^2 + (Net EW)^2}$.
        ❌ DO NOT DRAW A DIAGRAM. USE THIS ALGEBRAIC SHORTCUT ONLY.`;
        }

        return `${subjectConfig.persona}
        
        GOAL: Provide a "Cheat Sheet" style solution in maximum 3 steps.
        CONSTRAINT: Use LaTeX for all mathematical expressions. Wrap inline math in $...$ (e.g., $x^2$) and block math in $$...$$.
        ${specificShortcutInstruction}

        [HIDDEN THINKING INSTRUCTION]
        You MUST first plan your logic inside a '[HIDDEN]' ... '[/HIDDEN]' block. 
        - Analyze the question step-by-step here to ensure accuracy.
        - ${PROMPTS_CONFIG.syllabusGuardrails.mathVerification}
        - Verify your logic before committing to the final answer.
        - This block will NOT be seen by the student.
        - **Visible Constraint**: Do NOT include self-correction phrases like "Actually" or "Incorrect" in the final output.

        [MANDATORY RESPONSE FORMAT - YOU MUST FOLLOW THIS EXACTLY]
        💡 CORE: Identify the main concept/rule in one line.
        🚀 ${subjectConfig.steps.step1.title.split('. ')[1].toUpperCase()}:
        1. Step one
        2. Step two
        3. Step three (Result)
        🔥 ${subjectConfig.steps.step2.title.split('. ')[1].toUpperCase()}: 15-second "Ranker's" tip.
        
        **CRITICAL**: You MUST include ALL sections above, especially the 🔥 RANKER'S HACK section. This is NON-NEGOTIABLE.
        
        EXAMPLE:
        💡 CORE: Approach Name
        🚀 SHORTCUT/DIRECT ANSWER:
        1. Observation...
        2. Calculation...
        3. Final Answer
        🔥 MEMORY HACK/TRICK: Mnemonic or quick check.

        Question Content:
        ${this.sanitizeInput(question.content)}
 
        Options:
        ${optionsText}
 
        Correct Answer: ${question.correctOptionId} - ${this.sanitizeInput(correctOption?.text || 'N/A')}
 
        GENERATE EXPLANATION FOLLOWING THE [MANDATORY RESPONSE FORMAT] STRICTLY. DO NOT SKIP THE 🔥 RANKER'S HACK SECTION:`;
    }

    /**
     * Build a prompt for the "Blind Solve" verification.
     * The AI is NOT given the correct answer ID and must solve it independently.
     */
    buildBlindSolvePrompt(question: Question): string {
        const subjectTitle = question.subject?.title || PROMPTS_CONFIG.defaultSubject;
        const optionsText = question.options
            .map((opt: any) => `${opt.id}. ${this.sanitizeInput(opt.text)}`)
            .join('\n');

        const imageInstruction = question.imageUrl
            ? "- **VISUAL INPUT**: A diagram/image is provided. Use it to extract necessary data (geometry, graphs, etc.)."
            : "";

        return `You are an objective Mathematical Expert and Competitive Exam Tutor.
        
        ### TASK:
        Solve the following question independently. You are NOT provided with the answer key.
        Your goal is to find the mathematical/logical truth.
        
        ### CONTEXT:
        - **Subject**: ${subjectTitle}
        - **Topic**: ${question.topic || 'General'}
        ${imageInstruction}
        
        ### QUESTION:
        ${this.sanitizeInput(question.content)}
        
        ### OPTIONS:
        ${optionsText}
        
        ### INSTRUCTIONS:
        1. Solve the problem step-by-step inside a [HIDDEN] block.
        2. Identify the matching Option ID from the provided list.
        3. If the answer is not among the options, identify the closest logical error.
        4. Return your final conclusion strictly in the format below.
        
        [HIDDEN]
        [Detailed step-by-step mathematical reasoning here]
        [/HIDDEN]
        
        FINAL_ANSWER: [Option ID Only, e.g., A]
        LOGIC: [One-line summary of the core step]`;
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
    private getQuantPersonaInstructions(topic?: string): string {
        let shortcutsSection = '';

        // Filter shortcuts based on topic if provided
        if (topic) {
            const topicLower = topic.toLowerCase();
            const shortcuts = PROMPTS_CONFIG.subjects.quantReasoning.shortcuts;
            const relevantEntries = Object.entries(shortcuts).filter(([key]) => topicLower.includes(key));

            if (relevantEntries.length > 0) {
                shortcutsSection = relevantEntries.map(([key, val]) =>
                    `     - **${topic}**: Lead with **${val}**`
                ).join('\n');
            }
        }

        // If no topic matched or provided, fallback to generic guidance but AVOID listing specific formulas to prevent hallucination
        if (!shortcutsSection) {
            shortcutsSection = `     - **General**: Identify the pattern first (e.g., Symmetry, Unit Digit, Digital Sum).
     - **Arithmetic**: Look for Ratios or Percentage fractions.
     - **Geometry**: Check for Triplets or Standard Theorems.
     - **AVOID**: Long algebraic derivations.`;
        }

        return `${PROMPTS_CONFIG.subjects.quantReasoning.persona}
  
  ### CONSTRAINTS (MANDATORY):
  1. **ABSOLUTE BREVITY**: Avoid full sentences. Use arrows ($\\rightarrow$) for logical transitions. 
  2. **LEAD WITH FORMULA / TRICK**: 
${shortcutsSection}
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

