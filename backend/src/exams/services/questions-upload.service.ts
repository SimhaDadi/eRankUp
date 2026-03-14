import { Injectable, BadRequestException } from '@nestjs/common';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import { AIService } from '../../ai/ai.service';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

export interface ParsedQuestion {
    content: string;
    options: { id: string; text: string }[];
    correctOptionId: string | null;
    explanation?: string;
    topic: string;
    section?: string; // Maps to Subject/Section title for grouping
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

    async parseExamsFile(buffer: Buffer, mimetype: string): Promise<{ questions: ParsedQuestion[], failedRows: any[] }> {
        console.log(`[QuestionsUploadService] Processing file: ${mimetype}, Size: ${buffer.length} bytes`);
        if (mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel') {
            return this.parseCsv(buffer);
        } else if (mimetype === 'application/pdf' || mimetype.startsWith('image/')) {
            console.log(`[QuestionsUploadService] Routing to AI Parser for ${mimetype}`);
            const questions = await this.parseDocumentWithAI(buffer, mimetype);
            return { questions, failedRows: [] }; // AI parser already handles its own skipping/logging
        } else {
            console.warn(`[QuestionsUploadService] Unsupported file type: ${mimetype}`);
            throw new BadRequestException('Unsupported file type. Only CSV, PDF, and Images are supported.');
        }
    }

    private async parseCsv(buffer: Buffer): Promise<{ questions: ParsedQuestion[], failedRows: any[] }> {
        const stream = Readable.from(buffer.toString());
        const questions: ParsedQuestion[] = [];
        const failedRows: any[] = [];
        let rawRowCount = 0;

        return new Promise((resolve, reject) => {
            stream
                .pipe(csv({
                    strict: true,
                    mapHeaders: ({ header }) => header.trim().toLowerCase()
                }))
                .on('data', (row) => {
                    rawRowCount++;
                    const content = row.content || row.questiontext || row.question_text;
                    const optionA = row.optiona || row.option1;
                    const correctOptionId = row.correctoptionid || row.correctoption || row.correctanswer || row.correct_option_id;

                    if (!content || !optionA || !correctOptionId) {
                        failedRows.push({ ...row, error: 'Missing required fields (content, optionA, or correctOptionId)' });
                        return;
                    }

                    const options = [
                        { id: 'A', text: optionA },
                        { id: 'B', text: row.optionb || row.option2 || '' },
                        { id: 'C', text: row.optionc || row.option3 || '' },
                        { id: 'D', text: row.optiond || row.option4 || '' },
                    ].filter(o => o.text);

                    questions.push({
                        content: content,
                        options,
                        correctOptionId: correctOptionId.toString().toUpperCase(),
                        explanation: row.explanation || '',
                        topic: row.topic || 'General',
                        section: row.section || '',
                        difficultyWeight: parseFloat(row.difficultyweight || row.difficulty) || 0.5,
                        positiveMarks: parseFloat(row.positivemarks) || 1.0,
                        negativeMarks: parseFloat(row.negativemarks) || 0.25,
                        imageUrl: row.imageurl || row.image_url || row.image
                    });
                })
                .on('end', () => {
                    console.log(`[QuestionsUploadService] CSV Parsing finished. Total Raw Rows: ${rawRowCount}, Valid Questions: ${questions.length}, Failed Rows: ${failedRows.length}`);
                    resolve({ questions, failedRows });
                })
                .on('error', (error) => {
                    console.error('[QuestionsUploadService] CSV Parsing Error:', error.message);
                    reject(error);
                });
        });
    }

    private async parsePdf(buffer: Buffer): Promise<ParsedQuestion[]> {
        return this.parseDocumentWithAI(buffer, 'application/pdf');
    }

    async parseImage(buffer: Buffer, mimetype: string): Promise<ParsedQuestion[]> {
        return this.parseDocumentWithAI(buffer, mimetype);
    }

    private async parseDocumentWithAI(buffer: Buffer, mimetype: string): Promise<ParsedQuestion[]> {
        const startTime = Date.now();
        const parseLog: string[] = [];
        const log = (msg: string) => {
            const timestampedMsg = `[${new Date().toISOString()}] ${msg}`;
            console.log(timestampedMsg);
            parseLog.push(msg);
        };

        try {
            log(`[ImageUpload] Starting AI document parsing. MimeType: ${mimetype}, Size: ${buffer.length} bytes`);

            const aiResults = await this.aiService.parseDocument({ buffer, mimetype });

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            log(`[ImageUpload] AI parsing completed in ${duration}s. Raw results: ${aiResults?.length || 0} questions detected.`);

            if (!aiResults || aiResults.length === 0) {
                throw new BadRequestException('AI Parser returned 0 questions. Please ensure the document is clear and contains questions. Tips: Use high-resolution images, crop to show only the questions area.');
            }

            const parsedQuestions: ParsedQuestion[] = [];
            let skippedCount = 0;
            let diagramSuccessCount = 0;
            let diagramFailCount = 0;

            let imageMetadata: sharp.Metadata | null = null;
            if (mimetype.startsWith('image/')) {
                try {
                    imageMetadata = await sharp(buffer).metadata();
                    log(`[ImageUpload] Image dimensions: ${imageMetadata.width}x${imageMetadata.height}`);
                } catch (e) {
                    log(`[ImageUpload] WARNING: Failed to get image metadata: ${e.message}`);
                }
            }

            for (const [index, item] of aiResults.entries()) {
                // Validate required fields
                if (!item.content || !item.options || item.options.length < 2) {
                    log(`[ImageUpload] Skipping question ${index + 1}: Missing content or options`);
                    skippedCount++;
                    continue;
                }

                // Ensure options are strings (AI sometimes returns objects)
                const normalizedOptions = item.options.map((opt: any, optIndex: number) => {
                    const text = typeof opt === 'string' ? opt : (opt.text || opt.content || String(opt));
                    return {
                        id: String.fromCharCode(65 + optIndex),
                        text: text.trim()
                    };
                });

                // Validate correct answer
                let correctOptionId: string | null = null;
                if (typeof item.correctOptionIndex === 'number' && item.correctOptionIndex >= 0 && item.correctOptionIndex < normalizedOptions.length) {
                    correctOptionId = String.fromCharCode(65 + item.correctOptionIndex);
                } else if (typeof item.correctOptionId === 'string' && item.correctOptionId.length > 0) {
                    correctOptionId = item.correctOptionId.toUpperCase();
                } else {
                    log(`[ImageUpload] Question ${index + 1}: No correct answer found/marked. Setting to null.`);
                }

                const question: ParsedQuestion = {
                    content: item.content.trim(),
                    options: normalizedOptions,
                    correctOptionId,
                    explanation: item.explanation || '',
                    topic: item.topic || 'General',
                    difficultyWeight: parseFloat(item.difficultyWeight) || 0.5,
                    positiveMarks: parseFloat(item.positiveMarks) || 1.0,
                    negativeMarks: parseFloat(item.negativeMarks) || 0.25,
                    hasDiagram: item.hasDiagram,
                    diagram_coordinates: item.diagram_coordinates
                };

                // Handle diagram cropping
                if (question.hasDiagram && question.diagram_coordinates && imageMetadata) {
                    try {
                        const diagramUrl = await this.cropAndSaveDiagram(
                            buffer,
                            question.diagram_coordinates,
                            imageMetadata,
                            `q_${Date.now()}_${index}.png`
                        );
                        if (diagramUrl) {
                            question.imageUrl = diagramUrl;
                            diagramSuccessCount++;
                        } else {
                            log(`[ImageUpload] Question ${index + 1}: Diagram crop returned null`);
                            diagramFailCount++;
                        }
                    } catch (cropError) {
                        log(`[ImageUpload] Question ${index + 1}: Diagram crop failed - ${cropError.message}`);
                        diagramFailCount++;
                    }
                }

                parsedQuestions.push(question);
            }

            // Final summary
            log(`[ImageUpload] SUMMARY: Detected: ${aiResults.length}, Parsed: ${parsedQuestions.length}, Skipped: ${skippedCount}, Diagrams: ${diagramSuccessCount} success / ${diagramFailCount} failed`);

            // Write debug log to file for troubleshooting
            try {
                const logPath = path.join(process.cwd(), 'image_upload_debug.log');
                const logContent = parseLog.join('\n') + '\n---\n';
                fs.appendFileSync(logPath, logContent);
            } catch (e) {
                // Ignore log file errors
            }

            return parsedQuestions;

        } catch (error) {
            log(`[ImageUpload] ERROR: ${error.message}`);
            console.error('AI Parse Error:', error);
            throw new BadRequestException(error.message || 'Failed to parse file via AI Service.');
        }
    }

    private async cropAndSaveDiagram(
        buffer: Buffer,
        coords: [number, number, number, number],
        meta: sharp.Metadata,
        filename: string
    ): Promise<string> {
        let [ymin, xmin, ymax, xmax] = coords;

        // Auto-detect scale: If any value is < 1 and they aren't all 0, assume 0-1 scale and convert to 0-1000
        const isNormalized = coords.some(c => c > 0 && c <= 1.0);
        if (isNormalized && Math.max(...coords) <= 1.5) { // Safety check to ensure it's not just small 1000-scale values
            ymin *= 1000;
            xmin *= 1000;
            ymax *= 1000;
            xmax *= 1000;
        }

        // Scale coordinates from 0-1000 to actual pixels
        const left = Math.round((xmin / 1000) * (meta.width || 0));
        const top = Math.round((ymin / 1000) * (meta.height || 0));
        const width = Math.round(((xmax - xmin) / 1000) * (meta.width || 0));
        const height = Math.round(((ymax - ymin) / 1000) * (meta.height || 0));

        // Basic safety check for width/height
        if (width <= 0 || height <= 0) {
            console.warn(`[QuestionsUploadService] Invalid crop dimensions: w=${width}, h=${height} (Scaling: ${isNormalized ? '0-1' : '0-1000'})`);
            return null;
        }

        const uploadDir = path.join(process.cwd(), 'uploads', 'questions');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);

        await sharp(buffer)
            .extract({ left, top, width, height })
            .png()
            .toFile(filePath);

        // Return relative URL for static serving
        return `/uploads/questions/${filename}`;
    }

    async saveQuestionsToModel(modelId: string, parsedQuestions: ParsedQuestion[]) {
        return parsedQuestions;
    }
}
