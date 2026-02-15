import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doubt, DoubtStatus } from './entities/doubt.entity';

@Injectable()
export class DoubtsService {
    constructor(
        @InjectRepository(Doubt)
        private doubtRepository: Repository<Doubt>,
    ) { }

    async findAll(userId: string) {
        return this.doubtRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }

    async create(userId: string, question: string) {
        const doubt = this.doubtRepository.create({
            userId,
            question,
            status: DoubtStatus.PENDING
        });
        return this.doubtRepository.save(doubt);
    }

    async findAllForAdmin() {
        return this.doubtRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['user']
        });
    }

    async answerDoubt(id: string, answer: string, adminId: string) {
        const doubt = await this.doubtRepository.findOne({ where: { id } });
        if (!doubt) throw new NotFoundException('Doubt not found');

        doubt.answer = answer;
        doubt.status = DoubtStatus.ANSWERED;
        doubt.answeredBy = adminId;
        doubt.answeredAt = new Date();

        return this.doubtRepository.save(doubt);
    }
}
