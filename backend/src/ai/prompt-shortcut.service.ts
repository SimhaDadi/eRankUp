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
     * RAG Retrieval: Finds the most relevant shortcuts for a given question text/topic
     * Updated to return multiple results for complex problems.
     */
    async findRelevantShortcuts(topic: string, content: string): Promise<PromptShortcut[]> {
        try {
            // [Perf Audit Fix] 
            // Use SQL ILIKE for literal matching. Return up to 2 exact matches if possible.
            const exactMatches = await this.shortcutRepository.createQueryBuilder('s')
                .where('s.isActive = :isActive', { isActive: true })
                .andWhere(new Brackets(qb => {
                    qb.where('LOWER(s.topic) = LOWER(:topic)', { topic })
                        .orWhere('LENGTH(s.topic) > 5 AND LOWER(:content) LIKE \'%\' || LOWER(s.topic) || \'%\'', { content });
                }))
                .limit(2)
                .getMany();

            if (exactMatches.length > 1) return exactMatches;

            // Fallback to Vector Semantic Search for more variety
            const embeddingArray = await this.aiService.generateEmbedding(`${topic} ${content}`);
            const embeddingStr = `[${embeddingArray.join(',')}]`;

            const similarShortcuts = await this.shortcutRepository
                .createQueryBuilder('s')
                .where('s.isActive = true')
                .andWhere('s.embedding IS NOT NULL')
                .orderBy(`s.embedding <=> CAST(:embedding AS vector)`) // PGVector Cosine Distance
                .setParameters({ embedding: embeddingStr })
                .limit(3) // Return top 3 matches
                .getMany();

            // Merge exact matches and similar shortcuts, avoiding duplicates
            const allMatchIds = new Set(exactMatches.map(m => m.id));
            const distinctSimilar = similarShortcuts.filter(s => !allMatchIds.has(s.id));

            return [...exactMatches, ...distinctSimilar].slice(0, 3);
        } catch (error) {
            this.logger.error('RAG Retrieval failed', error);
            return [];
        }
    }

    /**
     * Uses AI to distill raw content (text/images) into a list of shortcut structures.
     * Updated to support BATCH detection.
     */
    async distillShortcut(rawText: string, images: { data: string; mimeType: string }[] = []) {
        let rawResponse = '';
        try {
            const prompt = this.promptBuilder.buildShortcutDistillerPrompt(rawText || 'Distill all mathematical shortcuts from the attached images.');
            rawResponse = await this.aiService.generateText(prompt, images);

            // 1. Robust JSON Extraction (handles conversational prefixes/suffixes)
            const firstBracket = rawResponse.indexOf('[');
            const lastBracket = rawResponse.lastIndexOf(']');

            if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
                this.logger.error('AI response does not contain a valid JSON array', { rawResponse });
                throw new Error('AI response was not in a recognizable format.');
            }

            let jsonString = rawResponse.substring(firstBracket, lastBracket + 1);

            // 2. Handle unescaped LaTeX backslashes (common failure point)
            // If parse fails, we try to escape backslashes that aren't already escaped
            let parsed;
            try {
                parsed = JSON.parse(jsonString);
            } catch (parseError) {
                this.logger.warn('Initial JSON parse failed, attempting backslash escaping fix...');
                // Regex: match \ only if not preceded by \ and not followed by ["/bfnrtu]
                const fixedJson = jsonString.replace(/(?<!\\)\\(?![\\"/bfnrtu])/g, '\\\\');
                parsed = JSON.parse(fixedJson);
            }

            // Normalize to array
            const results = Array.isArray(parsed) ? parsed : [parsed];

            // Basic validation
            const validResults = results.filter(item => item.topic && item.formula);

            if (validResults.length === 0) {
                throw new Error('No valid shortcuts could be identified in the content.');
            }

            return validResults;
        } catch (error) {
            this.logger.error('Failed to distill shortcuts from content', {
                error: error.message,
                rawResponse: rawResponse.substring(0, 500) // Log snippet for debugging
            });
            throw new Error(`AI distillation failed: ${error.message}`);
        }
    }
}
