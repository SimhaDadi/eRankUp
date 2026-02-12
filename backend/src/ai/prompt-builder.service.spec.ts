import { Test, TestingModule } from '@nestjs/testing';
import { PromptBuilderService } from './prompt-builder.service';
import { AIUtilsService } from './ai-utils.service';
import { Question } from '../exams/entities/question.entity';
import { AIChatMessage } from '../ai-chat/entities/chat-message.entity';
import { PROMPTS_CONFIG } from './config/prompts.config';

describe('PromptBuilderService', () => {
    let service: PromptBuilderService;
    let aiUtils: jest.Mocked<AIUtilsService>;

    // Mock helper to create test questions
    const createMockQuestion = (overrides: Partial<Question> = {}): Question => {
        return {
            id: 'test-id',
            content: 'Test question content',
            topic: 'Test Topic',
            options: [
                { id: 'A', text: 'Option A', questionId: 'test-id' },
                { id: 'B', text: 'Option B', questionId: 'test-id' },
                { id: 'C', text: 'Option C', questionId: 'test-id' },
                { id: 'D', text: 'Option D', questionId: 'test-id' },
            ],
            correctOptionId: 'A',
            subject: { id: 'sub-1', title: 'Quantitative Aptitude' },
            ...overrides,
        } as Question;
    };

    beforeEach(async () => {
        const mockAIUtilsService = {
            sanitizeInput: jest.fn((input) => input),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PromptBuilderService,
                { provide: AIUtilsService, useValue: mockAIUtilsService },
            ],
        }).compile();

        service = module.get<PromptBuilderService>(PromptBuilderService);
        aiUtils = module.get(AIUtilsService) as jest.Mocked<AIUtilsService>;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildExplanationPrompt', () => {
        it('should generate English-specific prompt', () => {
            const question = createMockQuestion({
                subject: { id: 'eng-1', title: 'English' } as any,
            });

            const prompt = service.buildExplanationPrompt({ question });

            expect(prompt).toContain(PROMPTS_CONFIG.subjects.english.steps.step1.title);
            expect(prompt).toContain(PROMPTS_CONFIG.subjects.english.steps.step2.title);
            expect(prompt).toContain('SSC CGL English Mentor');
        });

        it('should generate General Studies prompt for History', () => {
            const question = createMockQuestion({
                subject: { id: 'hist-1', title: 'History' } as any,
            });

            const prompt = service.buildExplanationPrompt({ question });

            expect(prompt).toContain(PROMPTS_CONFIG.subjects.generalStudies.steps.step1.title);
            expect(prompt).toContain(PROMPTS_CONFIG.subjects.generalStudies.steps.step2.title);
            expect(prompt).toContain('General Studies Mentor');
        });

        it('should generate General Studies prompt for Geography', () => {
            const question = createMockQuestion({
                subject: { id: 'geo-1', title: 'Geography' } as any,
            });

            const prompt = service.buildExplanationPrompt({ question });

            expect(prompt).toContain(PROMPTS_CONFIG.subjects.generalStudies.steps.step1.title);
            expect(prompt).toContain(PROMPTS_CONFIG.subjects.generalStudies.steps.step2.title);
        });

        it('should generate Quant-specific prompt for Quantitative Aptitude', () => {
            const question = createMockQuestion({
                subject: { id: 'quant-1', title: 'Quantitative Aptitude' } as any,
            });

            const prompt = service.buildExplanationPrompt({ question });

            expect(prompt).toContain('Extreme Shortcut Mode');
            expect(prompt).toContain('STRICTLY FORBIDDEN - NO ALGEBRA');
            expect(prompt).toContain('MAX 3 STEPS');
        });

        it('should generate Quant-specific prompt for Reasoning', () => {
            const question = createMockQuestion({
                subject: { id: 'reas-1', title: 'Logical Reasoning' } as any,
            });

            const prompt = service.buildExplanationPrompt({ question });

            expect(prompt).toContain('Extreme Shortcut Mode');
        });

        it('should include user wrong answer when provided', () => {
            const question = createMockQuestion();

            const prompt = service.buildExplanationPrompt({
                question,
                userAnswer: 'B',
            });

            expect(prompt).toContain("Student's Wrong Choice");
            expect(prompt).toContain('B) Option B');
        });

        it('should not include user wrong answer when answer is correct', () => {
            const question = createMockQuestion();

            const prompt = service.buildExplanationPrompt({
                question,
                userAnswer: 'A', // Correct answer
            });

            expect(prompt).not.toContain("Student's Wrong Choice");
        });

        it('should include context exam title when provided', () => {
            const question = createMockQuestion();

            const prompt = service.buildExplanationPrompt({
                question,
                contextExamTitle: 'SSC CGL 2024',
            });

            expect(prompt).toBeDefined();
            // Exam context is used internally but not directly in prompt
        });

        it('should include question content and options', () => {
            const question = createMockQuestion({
                content: 'What is 2 + 2?',
            });

            const prompt = service.buildExplanationPrompt({ question });

            expect(prompt).toContain('What is 2 + 2?');
            expect(prompt).toContain('Option A');
            expect(prompt).toContain('Option B');
            expect(prompt).toContain('**Correct Answer**: A)'); // Format is "**Correct Answer**: A) Option A"
        });

        it('should include syllabus guardrails', () => {
            const question = createMockQuestion();

            const prompt = service.buildExplanationPrompt({ question });

            expect(prompt).toContain('SYLLABUS GUARDRAILS');
            expect(prompt).toContain(PROMPTS_CONFIG.syllabusGuardrails.scope);
        });

        it('should include security instructions', () => {
            const question = createMockQuestion();

            const prompt = service.buildExplanationPrompt({ question });

            expect(prompt).toContain('[USER_DATA_START]');
            expect(prompt).toContain('[USER_DATA_END]');
            expect(prompt).toContain('CRITICAL SECURITY INSTRUCTION');
        });

        it('should call sanitizeInput for question content', () => {
            const question = createMockQuestion({
                content: 'Test content',
            });

            service.buildExplanationPrompt({ question });

            expect(aiUtils.sanitizeInput).toHaveBeenCalledWith('Test content');
        });
    });

    describe('buildChatPrompt', () => {
        const mockContext = {
            weakAreas: [
                { topic: 'Time & Work', mastery: 0.45 },
                { topic: 'Percentages', mastery: 0.60 },
            ],
            preferredLanguage: 'English',
            historicalInsights: [],
            currentTopicMastery: 0.5,
            temperament: {
                isLateNight: false,
                isEarlyMorning: false,
                currentTime: '10:00 AM',
            },
        };

        const mockHistory: AIChatMessage[] = [
            { id: '1', role: 'user', content: 'Hello', conversationId: 'conv-1' } as AIChatMessage,
            { id: '2', role: 'assistant', content: 'Hi there!', conversationId: 'conv-1' } as AIChatMessage,
        ];

        it('should include weak areas in prompt', () => {
            const prompt = service.buildChatPrompt({
                message: 'Help me with Time & Work',
                context: mockContext,
                history: mockHistory,
            });

            expect(prompt).toContain('Time & Work (45%)');
            expect(prompt).toContain('Percentages (60%)');
        });

        it('should handle empty weak areas', () => {
            const prompt = service.buildChatPrompt({
                message: 'Test message',
                context: { ...mockContext, weakAreas: [] },
                history: mockHistory,
            });

            expect(prompt).toContain('Weak Topics: None');
        });

        it('should include conversation history', () => {
            const prompt = service.buildChatPrompt({
                message: 'Test message',
                context: mockContext,
                history: mockHistory,
            });

            expect(prompt).toContain('Student: Hello');
            expect(prompt).toContain('Faculty: Hi there!');
        });

        it('should limit history to last 6 messages', () => {
            const longHistory: AIChatMessage[] = Array.from({ length: 10 }, (_, i) => ({
                id: `${i}`,
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: `Message ${i}`,
                conversationId: 'conv-1',
            })) as AIChatMessage[];

            const prompt = service.buildChatPrompt({
                message: 'Test',
                context: mockContext,
                history: longHistory,
            });

            expect(prompt).toContain('Message 4');
            expect(prompt).toContain('Message 9');
            expect(prompt).not.toContain('Message 0');
            expect(prompt).not.toContain('Message 1');
        });

        it('should include question context when provided', () => {
            const contextWithQuestion = {
                ...mockContext,
                questionContext: {
                    content: 'Test question',
                    options: 'A) 1, B) 2',
                    correctOption: 'A',
                    officialExplanation: 'Test explanation',
                    userPerformance: {
                        selectedOption: 'B',
                        isCorrect: false,
                        timeSpentSeconds: 45,
                    },
                    avgTopperTime: 30,
                },
            };

            const prompt = service.buildChatPrompt({
                message: 'Why is this wrong?',
                context: contextWithQuestion,
                history: mockHistory,
            });

            expect(prompt).toContain('ACTIVE QUESTION');
            expect(prompt).toContain('Test question');
            expect(prompt).toContain('STUDENT ACTION');
            expect(prompt).toContain('Selected: B (WRONG)');
            expect(prompt).toContain('Time Taken: 45s');
        });

        it('should include extreme shortcut instructions', () => {
            const prompt = service.buildChatPrompt({
                message: 'Test',
                context: mockContext,
                history: mockHistory,
            });

            expect(prompt).toContain('EXTREME SHORTCUT MODE');
            expect(prompt).toContain('3 STEPS OR LESS');
            expect(prompt).toContain('FORBID ALGEBRA');
        });

        it('should include LaTeX instructions', () => {
            const prompt = service.buildChatPrompt({
                message: 'Test',
                context: mockContext,
                history: mockHistory,
            });

            expect(prompt).toContain('VISUAL MATH (LaTeX)');
            expect(prompt).toContain('$ ...$');
        });
    });

    describe('buildQuickExplanationPrompt', () => {
        it('should generate minimal cheat sheet format', () => {
            const question = createMockQuestion();

            const prompt = service.buildQuickExplanationPrompt(question);

            expect(prompt).toContain(PROMPTS_CONFIG.subjects.quantReasoning.persona);
            expect(prompt).toContain('Cheat Sheet');
            expect(prompt).toContain('maximum 3 steps');
        });

        it('should include good response format template', () => {
            const question = createMockQuestion();

            const prompt = service.buildQuickExplanationPrompt(question);

            expect(prompt).toContain('[GOOD RESPONSE FORMAT]');
            expect(prompt).toContain('💡 CORE');
            expect(prompt).toContain(`🚀 ${PROMPTS_CONFIG.subjects.quantReasoning.steps.step1.title.split('. ')[1].toUpperCase()}`);
            expect(prompt).toContain(`🔥 ${PROMPTS_CONFIG.subjects.quantReasoning.steps.step2.title.split('. ')[1].toUpperCase()}`);
        });

        it('should include question content and options', () => {
            const question = createMockQuestion({
                content: 'Calculate the area',
            });

            const prompt = service.buildQuickExplanationPrompt(question);

            expect(prompt).toContain('Calculate the area');
            expect(prompt).toContain('A. Option A');
            expect(prompt).toContain('Correct Answer: A -'); // Format is "Correct Answer: A - Option A"
        });

        it('should call sanitizeInput for question content', () => {
            const question = createMockQuestion();

            service.buildQuickExplanationPrompt(question);

            expect(aiUtils.sanitizeInput).toHaveBeenCalled();
        });
    });

    describe('loadQuestionImage', () => {
        it('should return null for null input', async () => {
            const result = await service.loadQuestionImage(null);
            expect(result).toBeNull();
        });

        it('should return null for undefined input', async () => {
            const result = await service.loadQuestionImage(undefined);
            expect(result).toBeNull();
        });

        it('should return null for non-upload paths', async () => {
            const result = await service.loadQuestionImage('/invalid/path');
            expect(result).toBeNull();
        });

        it('should return null for empty string', async () => {
            const result = await service.loadQuestionImage('');
            expect(result).toBeNull();
        });

        // Note: Testing actual file loading would require mocking fs module
        // This is covered in integration tests
    });

    describe('sanitizeInput', () => {
        it('should delegate to AIService.sanitizeInput', () => {
            const input = 'Test input';

            service.sanitizeInput(input);

            aiUtils.sanitizeInput.mockReturnValue('Sanitized output');

            const result = service.sanitizeInput('Test input');

            expect(result).toBe('Sanitized output');
        });
    });
});
