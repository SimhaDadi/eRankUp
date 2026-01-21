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
        const csvContent = fileBuffer.toString('utf-8');
        const lines = csvContent.split(/\r?\n/);

        if (lines.length < 2) {
            throw new Error('CSV file is empty or missing headers');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['content', 'optiona', 'optionb', 'optionc', 'optiond', 'correctoption', 'topic'];

        for (const req of requiredHeaders) {
            if (!headers.includes(req)) {
                throw new Error(`Missing required header: ${req}`);
            }
        }

        const validQuestions = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Handle quoted CSV fields basic parsing
            const values = this.parseCSVLine(line);

            if (values.length !== headers.length) {
                errors.push(`Line ${i + 1}: Mismatch column count`);
                continue;
            }

            const row: any = {};
            headers.forEach((h, index) => {
                row[h] = values[index];
            });

            try {
                // Map CSV row to Question Entity
                const options = [
                    { id: 'A', text: row['optiona'] },
                    { id: 'B', text: row['optionb'] },
                    { id: 'C', text: row['optionc'] },
                    { id: 'D', text: row['optiond'] }
                ];

                const question = this.questionRepository.create({
                    content: row['content'],
                    options: options,
                    correctOptionId: row['correctoption'].toUpperCase(), // Expecting 'A', 'B', 'C', or 'D'
                    explanation: row['explanation'] || '',
                    topic: row['topic'],
                    positiveMarks: parseFloat(row['positivemarks']) || 1.0,
                    negativeMarks: parseFloat(row['negativemarks']) || 0.25,
                    difficultyWeight: 0.5 // Default
                });

                validQuestions.push(question);
            } catch (err) {
                errors.push(`Line ${i + 1}: ${err.message}`);
            }
        }

        if (validQuestions.length > 0) {
            await this.questionRepository.save(validQuestions);
        }

        return {
            importedCount: validQuestions.length,
            errors: errors
        };
    }

    async exportQuestions() {
        const questions = await this.questionRepository.find();

        const headers = ['id', 'content', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption', 'explanation', 'topic', 'positiveMarks', 'negativeMarks'];
        const csvRows = [headers.join(',')];

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

            csvRows.push(row.join(','));
        }

        return csvRows.join('\n');
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
