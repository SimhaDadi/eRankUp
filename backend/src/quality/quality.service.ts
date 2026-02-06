import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityFlag, FlagStatus, FlagType } from './entities/quality-flag.entity';

@Injectable()
export class QualityService {
    constructor(
        @InjectRepository(QualityFlag)
        private flagRepository: Repository<QualityFlag>,
    ) { }

    /**
     * Get quality flags with filtering and pagination
     */
    async getFlags(page: number = 1, limit: number = 20, status?: string, type?: string) {
        const queryBuilder = this.flagRepository.createQueryBuilder('flag')
            .leftJoinAndSelect('flag.question', 'question')
            .leftJoinAndSelect('flag.reporter', 'reporter')
            .leftJoinAndSelect('flag.reviewedBy', 'reviewedBy')
            .orderBy('flag.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (status && status !== 'ALL') {
            // Enum values are uppercase in DB
            queryBuilder.andWhere('flag.status = :status', { status: status.toUpperCase() });
        }

        if (type && type !== 'ALL') {
            queryBuilder.andWhere('flag.type = :type', { type: type.toUpperCase() });
        }

        const [flags, total] = await queryBuilder.getManyAndCount();

        return {
            flags: flags.map(flag => ({
                id: flag.id,
                type: flag.type,
                status: flag.status,
                description: flag.description,
                adminNotes: flag.adminNotes,
                question: flag.question ? {
                    id: flag.question.id,
                    content: flag.question.content,
                    topic: flag.question.topic
                } : null,
                reporter: flag.reporter ? {
                    name: flag.reporter.fullName,
                    email: flag.reporter.email
                } : null,
                reviewedBy: flag.reviewedBy ? {
                    name: flag.reviewedBy.fullName
                } : null,
                reviewedAt: flag.reviewedAt,
                createdAt: flag.createdAt
            })),
            total,
            page,
            limit
        };
    }

    /**
     * Get quality control statistics
     */
    async getStats() {
        const totalFlags = await this.flagRepository.count();
        const pendingFlags = await this.flagRepository.count({ where: { status: FlagStatus.PENDING } });
        const reviewedFlags = await this.flagRepository.count({ where: { status: FlagStatus.REVIEWED } });
        const resolvedFlags = await this.flagRepository.count({ where: { status: FlagStatus.RESOLVED } });
        const dismissedFlags = await this.flagRepository.count({ where: { status: FlagStatus.DISMISSED } });

        // Get flags by type
        const flagsByType = await this.flagRepository
            .createQueryBuilder('flag')
            .select('flag.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('flag.type')
            .getRawMany();

        return {
            total: totalFlags,
            byStatus: {
                pending: pendingFlags,
                reviewed: reviewedFlags,
                resolved: resolvedFlags,
                dismissed: dismissedFlags
            },
            byType: flagsByType.reduce((acc, item) => {
                acc[item.type] = parseInt(item.count);
                return acc;
            }, {})
        };
    }

    /**
     * Update flag status
     */
    async updateFlag(id: string, status: string, adminNotes: string, reviewedById: string) {
        const flag = await this.flagRepository.findOne({ where: { id } });

        if (!flag) {
            throw new Error('Flag not found');
        }

        flag.status = status as FlagStatus;
        if (adminNotes) {
            flag.adminNotes = adminNotes;
        }
        flag.reviewedById = reviewedById;
        flag.reviewedAt = new Date();

        await this.flagRepository.save(flag);

        return {
            success: true,
            message: 'Flag updated successfully',
            flag
        };
    }

    async getUserFlags(userId: string) {
        return this.flagRepository.find({
            where: { reporter: { id: userId } },
            relations: ['question'],
            order: { createdAt: 'DESC' }
        });
    }

    async flagQuestion(userId: string, questionId: string, type: any, description: string) {
        // Defensive: Ensure type is a valid FlagType enum value
        const validTypes = Object.values(FlagType);
        const finalType = validTypes.includes(type) ? type : FlagType.OTHER;

        const flag = this.flagRepository.create({
            reporterId: userId,
            questionId,
            type: finalType,
            description,
            status: FlagStatus.PENDING
        });

        return this.flagRepository.save(flag);
    }
}