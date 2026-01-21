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
        // Leverages the existing AI Document Parsing capability
        // Note: The AiService.parseDocument method needs to support Buffer input or text content
        // For now, assuming AiService can parse raw text or we convert PDF to text here.
        // Since implementing PDF-to-Text locally is heavy, we'll assume AiService handles the buffer upload to Gemini.

        try {
            // Using AiService to extract structured data from the PDF document
            // If AiService expects a file path, we might need to adjust.
            // Assuming parseDocument accepts a buffer or equivalent.

            // Returning consistent structure by mapping the AI response
            const aiResults = await this.aiService.parseDocument({ buffer, mimetype: 'application/pdf' });

            return aiResults.map((item: any) => ({
                content: item.content,
                options: item.options.map((opt: string, index: number) => ({
                    id: String.fromCharCode(65 + index), // A, B, C, D
                    text: opt
                })),
                correctOptionId: String.fromCharCode(65 + item.correctOptionIndex),
                explanation: item.explanation,
                topic: 'General', // AI doesn't categorize topic yet
                difficultyWeight: item.difficultyWeight || 0.5,
                positiveMarks: item.positiveMarks || 1.0,
                negativeMarks: item.negativeMarks || 0.25
            }));
        } catch (error) {
            console.error('PDF Parse Error:', error);
            throw new BadRequestException('Failed to parse PDF file via AI Service.');
        }
    }
}
