import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../exams/entities/question.entity';
import { Exam } from '../exams/entities/exam.entity';

@Injectable()
export class ContentService {
    constructor(
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
        @InjectRepository(Exam)
        private examRepository: Repository<Exam>,
    ) { }

    async importQuestions(fileBuffer: Buffer) {
        const stream = require('stream');
        const csv = require('csv-parser');
        const readableStream = stream.Readable.from(fileBuffer);

        const validQuestions = [];
        const errors = [];
        let lineCount = 1;

        return new Promise((resolve, reject) => {
            readableStream
                .pipe(csv())
                .on('data', (row: any) => {
                    lineCount++;
                    try {
                        // Validate headers mapping
                        const content = row['content'];
                        const optionA = row['optiona'];
                        const optionB = row['optionb'];
                        const optionC = row['optionc'];
                        const optionD = row['optiond'];
                        const correctOption = row['correctoption'];
                        const topic = row['topic'];

                        if (!content || !optionA || !optionB || !correctOption || !topic) {
                            errors.push(`Line ${lineCount}: Missing required fields`);
                            return;
                        }

                        const options = [
                            { id: 'A', text: optionA },
                            { id: 'B', text: optionB },
                            { id: 'C', text: optionC || '' },
                            { id: 'D', text: optionD || '' }
                        ];

                        const question = this.questionRepository.create({
                            content: content,
                            options: options,
                            correctOptionId: correctOption.toUpperCase(),
                            explanation: row['explanation'] || '',
                            topic: topic,
                            positiveMarks: parseFloat(row['positivemarks']) || 1.0,
                            negativeMarks: parseFloat(row['negativemarks']) || 0.25,
                            difficultyWeight: 0.5
                        });

                        validQuestions.push(question);
                    } catch (err) {
                        errors.push(`Line ${lineCount}: ${err.message}`);
                    }
                })
                .on('end', async () => {
                    try {
                        if (validQuestions.length > 0) {
                            // Batch save to avoid huge memory spikes but still fast
                            const batchSize = 1000;
                            for (let i = 0; i < validQuestions.length; i += batchSize) {
                                const batch = validQuestions.slice(i, i + batchSize);
                                await this.questionRepository.save(batch);
                            }
                        }
                        resolve({
                            importedCount: validQuestions.length,
                            errors: errors
                        });
                    } catch (err) {
                        reject(err);
                    }
                })
                .on('error', (err) => reject(err));
        });
    }

    exportQuestions() {
        const stream = require('stream');
        const readable = new stream.Readable({
            read() { }
        });

        const headers = ['id', 'content', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption', 'explanation', 'topic', 'positiveMarks', 'negativeMarks'];
        readable.push(headers.join(',') + '\n');

        // Note: In a real production environment with 10M+ rows, 
        // we would use a DB cursor here. For current scale, batching is sufficient.
        const batchSize = 500;
        let offset = 0;

        const pushNextBatch = async () => {
            try {
                const questions = await this.questionRepository.find({
                    skip: offset,
                    take: batchSize,
                    order: { id: 'DESC' }
                });

                if (questions.length === 0) {
                    readable.push(null);
                    return;
                }

                for (const q of questions) {
                    const optionsMap = q.options?.reduce((acc: any, opt: any) => {
                        acc[opt.id] = opt.text;
                        return acc;
                    }, {}) || {};

                    const row = [
                        q.id,
                        this.escapeCSV(q.content),
                        this.escapeCSV(optionsMap['A'] || ''),
                        this.escapeCSV(optionsMap['B'] || ''),
                        this.escapeCSV(optionsMap['C'] || ''),
                        this.escapeCSV(optionsMap['D'] || ''),
                        q.correctOptionId,
                        this.escapeCSV(q.explanation || ''),
                        this.escapeCSV(q.topic),
                        q.positiveMarks,
                        q.negativeMarks
                    ];
                    readable.push(row.join(',') + '\n');
                }

                offset += batchSize;
                // Schedule next batch to keep event loop free
                setImmediate(pushNextBatch);
            } catch (err) {
                readable.emit('error', err);
            }
        };

        pushNextBatch();
        return readable;
    }

    private parseCSVLine(line: string): string[] {
        const result = [];
        let currentValue = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    currentValue += '"';
                    i++;
                } else {
                    // Toggle quote
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        result.push(currentValue);
        return result;
    }

    private escapeCSV(field: any): string {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    }

    async checkForDuplicates(questions: string[]) {
        const potentialDuplicates = [];

        for (const content of questions) {
            // Find questions with similar content (exact match for now)
            // In a real app, use fuzzy search or cosine similarity
            const exists = await this.questionRepository.findOne({
                where: { content: content.trim() }
            });

            if (exists) {
                potentialDuplicates.push({
                    content: content,
                    existingId: exists.id,
                    topic: exists.topic
                });
            }
        }

        return {
            totalChecked: questions.length,
            duplicatesFound: potentialDuplicates.length,
            duplicates: potentialDuplicates
        };
    }
}
