import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { Subject } from './entities/subject.entity';
import { Chapter } from './entities/chapter.entity';
import { Model } from './entities/model.entity';
import { Question } from './entities/question.entity';

@Injectable()
export class ExamSeederService implements OnApplicationBootstrap {
    constructor(
        @InjectRepository(Exam) private examRepo: Repository<Exam>,
        @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
        @InjectRepository(Chapter) private chapterRepo: Repository<Chapter>,
        @InjectRepository(Model) private modelRepo: Repository<Model>,
        @InjectRepository(Question) private questionRepo: Repository<Question>,
    ) { }

    async onApplicationBootstrap() {
        const count = await this.examRepo.count();
        if (count > 0) return;

        console.log('Seeding Global Content Bank...');

        // 1. Create Global Subject
        const subject = await this.subjectRepo.save({
            title: 'Quantitative Aptitude',
            description: 'Numerical ability and mathematical skills.',
            icon: 'Binary'
        });

        // 2. Create Chapter for the Subject
        const chapter = await this.chapterRepo.save({
            title: 'Geometry & Mensuration',
            description: 'Study of shapes, sizes, and relative position of figures.',
            subject
        });

        // 3. Create Exam (Bundle)
        const exam = await this.examRepo.save({
            title: 'SSC CGL Tier I - 2024',
            description: 'Combined Graduate Level Examination by Staff Selection Commission.',
        });

        // 4. Create Model (Test) and link to Exam
        const model = await this.modelRepo.save({
            title: 'Geometry - Set A',
            chapter,
            exams: [exam]
        });

        // 5. Create Questions in Global Bank
        const questions = [
            {
                content: "The length of the diagonal of a square is 10cm. What is its area?",
                options: [
                    { id: "a", text: "25 cm²" },
                    { id: "b", text: "50 cm²" },
                    { id: "c", text: "100 cm²" },
                    { id: "d", text: "75 cm²" },
                ],
                correctOptionId: "b",
                explanation: "Area = 1/2 * d². Area = 1/2 * 10 * 10 = 50 cm².",
                models: [model],
                subject,
                chapter
            },
            {
                content: "If the radius of a circle is increased by 10%, what is the percentage increase in its area?",
                options: [
                    { id: "a", text: "10%" },
                    { id: "b", text: "20%" },
                    { id: "c", text: "21%" },
                    { id: "d", text: "100%" },
                ],
                correctOptionId: "c",
                explanation: "Successive change = 10 + 10 + (10*10)/100 = 21%.",
                models: [model],
                subject,
                chapter
            }
        ];

        for (const q of questions) {
            await this.questionRepo.save(this.questionRepo.create(q));
        }

        console.log('Seeding Complete! Created Global Bank with 1 Subject, 1 Chapter, 1 Model linked to 1 Exam.');
    }
}
