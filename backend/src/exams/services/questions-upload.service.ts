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
        if (mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel') {
            return this.parseCsv(buffer);
        } else if (mimetype === 'application/pdf') {
            return this.parsePdf(buffer);
        } else {
            throw new BadRequestException('Unsupported file type. Only CSV and PDF are supported.');
        }
    }

    private async parseCsv(buffer: Buffer): Promise<ParsedQuestion[]> {
        const stream = Readable.from(buffer.toString());
        const questions: ParsedQuestion[] = [];

        return new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (row) => {
                    // Validating required CSV columns
                    if (!row.content || !row.optionA || !row.correctOptionId) {
                        return; // Skip invalid rows
                    }

                    const options = [
                        { id: 'A', text: row.optionA },
                        { id: 'B', text: row.optionB },
                        { id: 'C', text: row.optionC || '' },
                        { id: 'D', text: row.optionD || '' },
                    ].filter(o => o.text); // Remove empty options

                    questions.push({
                        content: row.content,
                        options,
                        correctOptionId: row.correctOptionId,
                        explanation: row.explanation,
                        topic: row.topic || 'General',
                        difficultyWeight: parseFloat(row.difficultyWeight) || 0.5,
                        positiveMarks: parseFloat(row.positiveMarks) || 1.0,
                        negativeMarks: parseFloat(row.negativeMarks) || 0.25,
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
            throw new BadRequestException('Failed to parse file via AI Service.');
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
