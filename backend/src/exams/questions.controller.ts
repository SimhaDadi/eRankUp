import { Controller, Post, Get, Patch, Body, Param, Query, Request, UseGuards, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Question } from '../exams/entities/question.entity';
import { Subject } from '../exams/entities/subject.entity';
import { Chapter } from '../exams/entities/chapter.entity';
import { Exam } from '../exams/entities/exam.entity';
import { AIService } from '../ai/ai.service';

@Controller('questions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class QuestionsController {
    constructor(
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
        @InjectRepository(Subject)
        private subjectRepository: Repository<Subject>,
        @InjectRepository(Chapter)
        private chapterRepository: Repository<Chapter>,
        @InjectRepository(Exam)
        private examRepository: Repository<Exam>,
        private readonly aiService: AIService,
    ) { }

    @Get()
    async findAll(
        @Query('examId') examId?: string,
        @Query('subjectId') subjectId?: string,
        @Query('chapterId') chapterId?: string,
        @Query('topic') topic?: string,
        @Query('difficulty') difficulty?: string
    ) {
        try {

            const queryBuilder = this.questionRepository.createQueryBuilder('question')
                .leftJoinAndSelect('question.subject', 'subject')
                .leftJoinAndSelect('question.chapter', 'chapter');

            if (examId) {
                queryBuilder.innerJoin('question.exams', 'exams', 'exams.id = :examId', { examId });
            } else {
                queryBuilder.leftJoinAndSelect('question.exams', 'exams');
            }

            if (subjectId) queryBuilder.andWhere('subject.id = :subjectId', { subjectId });
            if (chapterId) queryBuilder.andWhere('chapter.id = :chapterId', { chapterId });
            if (topic) queryBuilder.andWhere('question.topic ILIKE :topic', { topic: `%${topic}%` });

            if (difficulty) {
                const weight = difficulty === 'easy' ? 0.3 : difficulty === 'hard' ? 0.7 : 0.5;
                queryBuilder.andWhere('question.difficultyWeight = :weight', { weight });
            }

            const questions = await queryBuilder.getMany();
            return questions;
        } catch (error) {
            throw new HttpException(error.message || 'Failed to fetch questions', HttpStatus.BAD_REQUEST);
        }
    }

    @Post()
    async createQuestion(@Body() questionData: any) {
        try {
            const { questionText, options, correctAnswer, topic, difficulty, subjectId, examId, chapterId, explanation } = questionData;

            // Validate required fields (examId is now optional for global questions)
            if (!questionText || !options || correctAnswer === undefined || !topic || !subjectId || !chapterId) {
                throw new HttpException('Missing required fields (questionText, options, correctAnswer, topic, subjectId, chapterId)', HttpStatus.BAD_REQUEST);
            }

            // Find subject, chapter, and exam
            const subject = await this.subjectRepository.findOne({ where: { id: subjectId } });
            const chapter = await this.chapterRepository.findOne({ where: { id: chapterId } });
            const exam = examId ? await this.examRepository.findOne({ where: { id: examId } }) : null;

            if (!subject || !chapter || (examId && !exam)) {
                throw new HttpException('Subject, Chapter, or specified Exam not found', HttpStatus.NOT_FOUND);
            }

            // Map options array to the format expected by Question entity
            const formattedOptions = options.map((text: string, index: number) => ({
                id: String.fromCharCode(65 + index), // A, B, C, D
                text: text
            }));

            const embedding = await this.aiService.generateEmbedding(questionText);

            const question = this.questionRepository.create({
                content: questionText,
                options: formattedOptions,
                correctOptionId: String.fromCharCode(65 + correctAnswer), // Convert 0,1,2,3 to A,B,C,D
                explanation: explanation || '',
                topic: topic,
                difficultyWeight: difficulty === 'easy' ? 0.3 : difficulty === 'hard' ? 0.7 : 0.5,
                positiveMarks: 1.0,
                negativeMarks: 0.25,
                subject: subject,
                chapter: chapter,
                chapterId: chapterId,
                exams: exam ? [exam] : [], // Now an array, can be empty for global questions
                embedding: embedding
            });

            const saved = await this.questionRepository.save(question);

            return {
                success: true,
                message: 'Question created successfully',
                data: saved
            };
        } catch (error) {
            throw new HttpException(error.message || 'Failed to create question', HttpStatus.BAD_REQUEST);
        }
    }

    @Patch(':id')
    async updateQuestion(@Param('id') id: string, @Body() updateData: any) {
        try {
            const question = await this.questionRepository.findOne({
                where: { id },
                relations: ['exams']
            });

            if (!question) {
                throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
            }

            // Handle linking new exams (REPLACE logic)
            if (updateData.examIds) {
                const newExams = await this.examRepository.find({ where: { id: In(updateData.examIds) } });
                question.exams = newExams;
            }

            // Handle single exam push (ADD logic)
            if (updateData.addExamId) {
                const examToAdd = await this.examRepository.findOne({ where: { id: updateData.addExamId } });
                if (examToAdd) {
                    if (!question.exams.find(e => e.id === examToAdd.id)) {
                        question.exams.push(examToAdd);
                    }
                }
            }

            if (updateData.questionText) {
                question.content = updateData.questionText;
                // Update embedding when content changes
                try {
                    question.embedding = await this.aiService.generateEmbedding(updateData.questionText);
                } catch (e) {
                    console.error(`Failed to update embedding during question edit: ${e.message}`);
                }
            }
            if (updateData.correctAnswer !== undefined) question.correctOptionId = String.fromCharCode(65 + updateData.correctAnswer);
            if (updateData.explanation) question.explanation = updateData.explanation;
            if (updateData.topic) question.topic = updateData.topic;
            if (updateData.difficulty) question.difficultyWeight = updateData.difficulty === 'easy' ? 0.3 : updateData.difficulty === 'hard' ? 0.7 : 0.5;

            const saved = await this.questionRepository.save(question);
            return { success: true, data: saved };

        } catch (error) {
            throw new HttpException(error.message || 'Failed to update question', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('bulk-upload')
    @UseInterceptors(FileInterceptor('file'))
    async bulkUpload(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
        }

        if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
            throw new HttpException('Only CSV files are allowed', HttpStatus.BAD_REQUEST);
        }

        try {
            const csvContent = file.buffer.toString('utf-8');
            const lines = csvContent.split(/\r?\n/);

            if (lines.length < 2) {
                throw new Error('CSV file is empty or missing headers');
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const validQuestions = [];
            const errors = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

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
                    const examId = row['examid'];
                    let subjectId = row['subjectid'];
                    const chapterId = row['chapterid'];

                    if (!chapterId) {
                        errors.push(`Line ${i + 1}: Missing chapterId (required)`);
                        continue;
                    }

                    // Fetch hierarchy entities
                    const exam = examId ? await this.examRepository.findOne({ where: { id: examId } }) : null;
                    const chapter = await this.chapterRepository.findOne({
                        where: { id: chapterId },
                        relations: ['subject']
                    });

                    if (!chapter) {
                        errors.push(`Line ${i + 1}: Chapter not found`);
                        continue;
                    }

                    // Infer subjectId if missing
                    if (!subjectId && chapter.subject) {
                        subjectId = chapter.subject.id;
                    }

                    const subject = subjectId ? await this.subjectRepository.findOne({ where: { id: subjectId } }) : null;

                    if (!subject || (examId && !exam)) {
                        errors.push(`Line ${i + 1}: Invalid hierarchy IDs - subject or specified exam not found`);
                        continue;
                    }

                    const options = [
                        { id: 'A', text: row['optiona'] || row['option1'] },
                        { id: 'B', text: row['optionb'] || row['option2'] },
                        { id: 'C', text: row['optionc'] || row['option3'] },
                        { id: 'D', text: row['optiond'] || row['option4'] }
                    ];

                    const question = this.questionRepository.create({
                        content: row['content'] || row['questiontext'],
                        options: options,
                        correctOptionId: (row['correctoptionid'] || row['correctoption'] || row['correctanswer']).toUpperCase(),
                        explanation: row['explanation'] || '',
                        topic: row['topic'],
                        positiveMarks: parseFloat(row['positivemarks']) || 1.0,
                        negativeMarks: parseFloat(row['negativemarks']) || 0.25,
                        difficultyWeight: row['difficultyweight'] ? parseFloat(row['difficultyweight']) : (row['difficulty'] === 'easy' ? 0.3 : row['difficulty'] === 'hard' ? 0.7 : 0.5),
                        exams: exam ? [exam] : [], // Now an array, can be empty for global questions
                        subject: subject,
                        chapter: chapter,
                        chapterId: chapterId
                    });

                    validQuestions.push(question);
                } catch (err) {
                    errors.push(`Line ${i + 1}: ${err.message}`);
                }
            }

            if (validQuestions.length > 0) {
                // Generate embeddings for all valid questions before saving
                for (const q of validQuestions) {
                    try {
                        q.embedding = await this.aiService.generateEmbedding(q.content);
                    } catch (e) {
                        console.error(`Failed to generate embedding for bulk question: ${e.message}`);
                    }
                }
                await this.questionRepository.save(validQuestions);
            }

            return {
                success: true,
                message: `Successfully imported ${validQuestions.length} questions`,
                importedCount: validQuestions.length,
                errors: errors
            };
        } catch (error) {
            throw new HttpException(error.message || 'Failed to upload questions', HttpStatus.BAD_REQUEST);
        }
    }

    private parseCSVLine(line: string): string[] {
        const result = [];
        let currentValue = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    currentValue += '"';
                    i++;
                } else {
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
}
