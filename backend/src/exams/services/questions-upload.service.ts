import { Injectable, BadRequestException } from '@nestjs/common';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import { AIService } from '../../ai/ai.service'; // Assuming AiService is here or shared

export interface ParsedQuestion {
    content: string;
    options: { id: string; text: string }[];
    correctOptionId: string;
    explanation?: string;
    topic: string;
    difficultyWeight?: number;
    positiveMarks?: number;
    negativeMarks?: number;
}

@Injectable()
export class QuestionsUploadService {
    constructor(private readonly aiService: AIService) { }

    async parseExamsFile(buffer: Buffer, mimetype: string): Promise<ParsedQuestion[]> {
        console.log(`[QuestionsUploadService] Processing file: ${mimetype}, Size: ${buffer.length} bytes`);
        if (mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel') {
            return this.parseCsv(buffer);
        } else if (mimetype === 'application/pdf' || mimetype.startsWith('image/')) {
            console.log(`[QuestionsUploadService] Routing to AI Parser for ${mimetype}`);
            return this.parseDocumentWithAI(buffer, mimetype);
        } else {
            console.warn(`[QuestionsUploadService] Unsupported file type: ${mimetype}`);
            throw new BadRequestException('Unsupported file type. Only CSV, PDF, and Images are supported.');
        }
    }

    private async parseCsv(buffer: Buffer): Promise<ParsedQuestion[]> {
        const stream = Readable.from(buffer.toString());
        const questions: ParsedQuestion[] = [];

        return new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (row) => {
                    // Validating required CSV columns with aliases
                    const content = row.content || row.questiontext;
                    const optionA = row.optionA || row.option1;
                    const correctOptionId = row.correctOptionId || row.correctOption || row.correctAnswer;

                    if (!content || !optionA || !correctOptionId) {
                        return; // Skip invalid rows
                    }

                    const options = [
                        { id: 'A', text: optionA },
                        { id: 'B', text: row.optionB || row.option2 },
                        { id: 'C', text: row.optionC || row.option3 || '' },
                        { id: 'D', text: row.optionD || row.option4 || '' },
                    ].filter(o => o.text); // Remove empty options

                    questions.push({
                        content: content,
                        options,
                        correctOptionId: correctOptionId.toUpperCase(),
                        explanation: row.explanation,
                        topic: row.topic || 'General',
                        difficultyWeight: parseFloat(row.difficultyWeight || row.difficulty) || 0.5,
                        positiveMarks: parseFloat(row.positiveMarks || row.positivemarks) || 1.0,
                        negativeMarks: parseFloat(row.negativeMarks || row.negativemarks) || 0.25,
                    });
                })
                .on('end', () => resolve(questions))
                .on('error', (error) => reject(error));
        });
    }

    private async parsePdf(buffer: Buffer): Promise<ParsedQuestion[]> {
        return this.parseDocumentWithAI(buffer, 'application/pdf');
    }

    async parseImage(buffer: Buffer, mimetype: string): Promise<ParsedQuestion[]> {
        return this.parseDocumentWithAI(buffer, mimetype);
    }

    private async parseDocumentWithAI(buffer: Buffer, mimetype: string): Promise<ParsedQuestion[]> {
        try {
            const aiResults = await this.aiService.parseDocument({ buffer, mimetype });

            return aiResults.map((item: any) => ({
                content: item.content,
                options: item.options.map((opt: string, index: number) => ({
                    id: String.fromCharCode(65 + index), // A, B, C, D
                    text: opt
                })),
                correctOptionId: typeof item.correctOptionIndex === 'number'
                    ? String.fromCharCode(65 + item.correctOptionIndex)
                    : 'A', // Default or handle appropriately
                explanation: item.explanation,
                topic: 'General',
                difficultyWeight: item.difficultyWeight || 0.5,
                positiveMarks: item.positiveMarks || 1.0,
                negativeMarks: item.negativeMarks || 0.25
            }));
        } catch (error) {
            console.error('AI Parse Error:', error);
            // Pass through the specific error message from AIService
            throw new BadRequestException(error.message || 'Failed to parse file via AI Service.');
        }
    }

    async saveQuestionsToModel(modelId: string, parsedQuestions: ParsedQuestion[]) {
        // This method will be implemented in ExamsService or called from Controller
        // Wait, QuestionsUploadService is responsible for parsing. 
        // Actual saving logic often resides in ExamsService to access Repositories.
        // But we can return the parsed questions to the controller, and let the controller call ExamsService.createQuestionsBulk.
        // Actually, ExamsService.createQuestionsBulk takes an array. 
        // So this Service assumes responsibility for Parsing only?
        // The file name implies Upload Service. 
        // Let's keep it focused on parsing.
        // But the previous plan said "add saveQuestionsToModel method".
        // Let's verify where repositories are injected.
        // This service ONLY has AIService injected.
        // So checking the imports... yes only AIService.
        // So I CANNOT save to DB here without injecting repositories.
        // It is better to return parsed questions and let ExamsService handle saving.
        return parsedQuestions;
    }
}
