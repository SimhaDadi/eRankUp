import { Test, TestingModule } from '@nestjs/testing';
import { PromptBuilderService } from './prompt-builder.service';
import { AIUtilsService } from './ai-utils.service';
import { InvalidPromptInputException, MissingPromptParameterException } from './exceptions/prompt-validation.exception';

describe('PromptBuilderService - Input Validation', () => {
    let service: PromptBuilderService;

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
    });

    describe('buildExplanationPrompt validation', () => {
        it('should throw when options is null', () => {
            expect(() => service.buildExplanationPrompt(null as any)).toThrow(MissingPromptParameterException);
        });

        it('should throw when question is missing', () => {
            expect(() => service.buildExplanationPrompt({} as any)).toThrow(MissingPromptParameterException);
        });

        it('should throw when question.content is empty', () => {
            const options = {
                question: {
                    content: '',
                    options: [{ id: 'A', text: 'Option A' }],
                    correctOptionId: 'A',
                } as any,
            };
            expect(() => service.buildExplanationPrompt(options)).toThrow(InvalidPromptInputException);
        });

        it('should throw when question.options is empty array', () => {
            const options = {
                question: {
                    content: 'Test question',
                    options: [],
                    correctOptionId: 'A',
                } as any,
            };
            expect(() => service.buildExplanationPrompt(options)).toThrow(InvalidPromptInputException);
        });

        it('should throw when correctOptionId does not match any option', () => {
            const options = {
                question: {
                    content: 'Test question',
                    options: [{ id: 'A', text: 'Option A' }],
                    correctOptionId: 'B',
                } as any,
            };
            expect(() => service.buildExplanationPrompt(options)).toThrow(InvalidPromptInputException);
        });

        it('should throw when userAnswer does not match any option', () => {
            const options = {
                question: {
                    content: 'Test question',
                    options: [{ id: 'A', text: 'Option A' }],
                    correctOptionId: 'A',
                } as any,
                userAnswer: 'B',
            };
            expect(() => service.buildExplanationPrompt(options)).toThrow(InvalidPromptInputException);
        });
    });

    describe('buildChatPrompt validation', () => {
        it('should throw when options is null', () => {
            expect(() => service.buildChatPrompt(null as any)).toThrow(MissingPromptParameterException);
        });

        it('should throw when message is empty', () => {
            const options = {
                message: '',
                context: { weakAreas: [] },
                history: [],
            } as any;
            expect(() => service.buildChatPrompt(options)).toThrow(InvalidPromptInputException);
        });

        it('should throw when message exceeds 5000 characters', () => {
            const options = {
                message: 'a'.repeat(5001),
                context: { weakAreas: [] },
                history: [],
            } as any;
            expect(() => service.buildChatPrompt(options)).toThrow(InvalidPromptInputException);
        });

        it('should throw when context is missing', () => {
            const options = {
                message: 'Test message',
                history: [],
            } as any;
            expect(() => service.buildChatPrompt(options)).toThrow(MissingPromptParameterException);
        });

        it('should throw when weakAreas is not an array', () => {
            const options = {
                message: 'Test message',
                context: { weakAreas: 'not an array' },
                history: [],
            } as any;
            expect(() => service.buildChatPrompt(options)).toThrow(InvalidPromptInputException);
        });

        it('should throw when history is not an array', () => {
            const options = {
                message: 'Test message',
                context: { weakAreas: [] },
                history: 'not an array',
            } as any;
            expect(() => service.buildChatPrompt(options)).toThrow(InvalidPromptInputException);
        });
    });

    describe('buildQuickExplanationPrompt validation', () => {
        it('should throw when question is null', () => {
            expect(() => service.buildQuickExplanationPrompt(null as any)).toThrow(MissingPromptParameterException);
        });

        it('should throw when question.content is empty', () => {
            const question = {
                content: '',
                options: [{ id: 'A', text: 'Option A' }],
                correctOptionId: 'A',
            } as any;
            expect(() => service.buildQuickExplanationPrompt(question)).toThrow(InvalidPromptInputException);
        });

        it('should throw when question.options is not an array', () => {
            const question = {
                content: 'Test question',
                options: null,
                correctOptionId: 'A',
            } as any;
            expect(() => service.buildQuickExplanationPrompt(question)).toThrow(InvalidPromptInputException);
        });

        it('should throw when correctOptionId is missing', () => {
            const question = {
                content: 'Test question',
                options: [{ id: 'A', text: 'Option A' }],
                correctOptionId: null,
            } as any;
            expect(() => service.buildQuickExplanationPrompt(question)).toThrow(InvalidPromptInputException);
        });
    });
});
