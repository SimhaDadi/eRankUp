import { Injectable, BadRequestException } from '@nestjs/common';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import { AIService } from '../../ai/ai.service';
import * as sharp from 'sharp';

export interface ParsedQuestion {
    content: string;
    options: { id: string; text: string }[];
    correctOptionId: string;
    explanation?: string;
    topic: string;
    difficultyWeight?: number;
    positiveMarks?: number;
    negativeMarks?: number;
    imageUrl?: string;
    hasDiagram?: boolean;
    diagram_coordinates?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
}

@Injectable()
export class QuestionsUploadService {
    constructor(
        private readonly aiService: AIService,
    ) { }

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
                .pipe(csv({ strict: true, mapHeaders: ({ header }) => header.trim() }))
                .on('data', (row) => {
                    const content = row.content || row.questiontext;
                    const optionA = row.optionA || row.option1;
                    const correctOptionId = row.correctOptionId || row.correctOption || row.correctAnswer;

                    if (!content || !optionA || !correctOptionId) {
                        return;
                    }

                    const options = [
                        { id: 'A', text: optionA },
                        { id: 'B', text: row.optionB || row.option2 },
                        { id: 'C', text: row.optionC || row.option3 || '' },
                        { id: 'D', text: row.optionD || row.option4 || '' },
                    ].filter(o => o.text);

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

            if (!aiResults || aiResults.length === 0) {
                throw new BadRequestException('AI Parser returned 0 questions. Please ensure the document is clear and contains questions.');
            }

            const parsedQuestions: ParsedQuestion[] = [];

            let imageMetadata: sharp.Metadata | null = null;
            if (mimetype.startsWith('image/')) {
                try {
                    imageMetadata = await sharp(buffer).metadata();
                } catch (e) {
                    console.error('[QuestionsUploadService] Failed to get image metadata:', e);
                }
            }

            for (const [index, item] of aiResults.entries()) {
                const question: ParsedQuestion = {
                    content: item.content,
                    options: item.options.map((opt: string, optIndex: number) => ({
                        id: String.fromCharCode(65 + optIndex),
                        text: opt
                    })),
                    correctOptionId: typeof item.correctOptionIndex === 'number'
                        ? String.fromCharCode(65 + item.correctOptionIndex)
                        : 'A',
                    explanation: item.explanation,
                    topic: 'General',
                    difficultyWeight: item.difficultyWeight || 0.5,
                    positiveMarks: item.positiveMarks || 1.0,
                    negativeMarks: item.negativeMarks || 0.25,
                    hasDiagram: item.hasDiagram,
                    diagram_coordinates: item.diagram_coordinates
                };

                // Smart Crop logic was here, removed for baseline verify
                parsedQuestions.push(question);
            }

            return parsedQuestions;

        } catch (error) {
            console.error('AI Parse Error:', error);
            throw new BadRequestException(error.message || 'Failed to parse file via AI Service.');
        }
    }

    async saveQuestionsToModel(modelId: string, parsedQuestions: ParsedQuestion[]) {
        return parsedQuestions;
    }
}
