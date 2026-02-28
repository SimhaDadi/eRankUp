import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { PromptShortcut } from './entities/prompt-shortcut.entity';
import { AIService } from './ai.service';
import { PromptBuilderService } from './prompt-builder.service';
import { CreateShortcutDto, UpdateShortcutDto } from './dto/prompt-shortcut.dto';

@Injectable()
export class PromptShortcutService {
    private readonly logger = new Logger(PromptShortcutService.name);

    constructor(
        @InjectRepository(PromptShortcut)
        private shortcutRepository: Repository<PromptShortcut>,
        private aiService: AIService,
        private promptBuilder: PromptBuilderService,
    ) { }

    async create(createDto: CreateShortcutDto) {
        // Automatically generate semantic embedding for keyword search
        let embedding = null;
        try {
            const searchText = `${createDto.topic} ${createDto.keywords || ''} ${createDto.formula}`;
            const embeddingArray = await this.aiService.generateEmbedding(searchText);
            embedding = `[${embeddingArray.join(',')}]`;
        } catch (error) {
            this.logger.error('Failed to generate embedding for new shortcut', error);
        }

        const shortcut = this.shortcutRepository.create({
            ...createDto,
            embedding,
        });

        return await this.shortcutRepository.save(shortcut);
    }

    async findAll() {
        return await this.shortcutRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async update(id: string, updateDto: UpdateShortcutDto) {
        const shortcut = await this.shortcutRepository.findOne({ where: { id } });
        if (!shortcut) throw new NotFoundException('Shortcut not found');

        Object.assign(shortcut, updateDto);

        // Regenerate embedding if core content changed
        if (updateDto.topic || updateDto.keywords || updateDto.formula) {
            try {
                const searchText = `${shortcut.topic} ${shortcut.keywords || ''} ${shortcut.formula}`;
                const embeddingArray = await this.aiService.generateEmbedding(searchText);
                shortcut.embedding = `[${embeddingArray.join(',')}]`;
            } catch (error) {
                this.logger.error(`Failed to update embedding for shortcut ${id}`, error);
            }
        }

        return await this.shortcutRepository.save(shortcut);
    }

    async remove(id: string) {
        const result = await this.shortcutRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException('Shortcut not found');
        return true;
    }

    /**
     * RAG Retrieval: Finds the most relevant shortcut for a given question text/topic
     */
    async findRelevantShortcut(topic: string, content: string): Promise<PromptShortcut | null> {
        try {
            // [Perf Audit Fix] 
            // Avoid loading the entire Vector DB into Node.js memory. 
            // Use SQL ILIKE for literal matching before falling back to vectors.
            const exactMatch = await this.shortcutRepository.createQueryBuilder('s')
                .where('s.isActive = :isActive', { isActive: true })
                .andWhere(new Brackets(qb => {
                    qb.where('LOWER(s.topic) = LOWER(:topic)', { topic })
                        .orWhere('LENGTH(s.topic) > 5 AND LOWER(:content) LIKE \'%\' || LOWER(s.topic) || \'%\'', { content });
                }))
                .getOne();

            if (exactMatch) return exactMatch;

            // Fallback to Vector Semantic Search
            const embeddingArray = await this.aiService.generateEmbedding(`${topic} ${content}`);
            const embeddingStr = `[${embeddingArray.join(',')}]`;

            const similarShortcut = await this.shortcutRepository
                .createQueryBuilder('s')
                .where('s.isActive = true')
                .andWhere('s.embedding IS NOT NULL')
                .orderBy(`s.embedding <=> CAST(:embedding AS vector)`) // PGVector Cosine Distance
                .setParameters({ embedding: embeddingStr })
                .limit(1)
                .getOne();

            return similarShortcut;
        } catch (error) {
            this.logger.error('RAG Retrieval failed', error);
            return null;
        }
    }

    /**
     * Uses AI to distill a raw explanation into a shortcut structure
     * Supports optional multi-modal images
     */
    async distillShortcut(rawText: string, images: { data: string; mimeType: string }[] = []) {
        try {
            const prompt = this.promptBuilder.buildShortcutDistillerPrompt(rawText || 'Distill the mathematical shortcut from the attached images.');
            const response = await this.aiService.generateText(prompt, images);

            // Clean the response to extract JSON
            const cleanJson = response.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            this.logger.error('Failed to distill shortcut from content', error);
            throw new Error('AI could not parse this shortcut. Please try a clearer description or better images.');
        }
    }
}
