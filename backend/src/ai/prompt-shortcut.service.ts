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
                .andWhere('s.embedding <=> CAST(:embedding AS vector) < 0.45') // Threshold: Ignore highly dissimilar queries
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
     * SIMPLIFIED: No smart routing, no sharp, identical pattern to ExplanationService.
     */
    async distillShortcut(rawText: string, images: { data: string; mimeType: string }[] = []) {
        this.logger.log(`[distillShortcut] START — text length: ${(rawText || '').length}, images: ${images.length}`);

        // Step 1: Build prompt
        const prompt = this.promptBuilder.buildShortcutDistillerPrompt(
            rawText || 'Distill all mathematical shortcuts from the attached images.'
        );
        this.logger.log(`[distillShortcut] Prompt built (length: ${prompt.length})`);

        // Step 2: Call AI — same as ExplanationService, no overrides
        let rawResponse = '';
        try {
            rawResponse = await this.aiService.generateText(prompt, images);
            this.logger.log(`[distillShortcut] AI responded (length: ${rawResponse.length}). Sample: ${rawResponse.substring(0, 200)}`);
        } catch (aiError) {
            this.logger.error(`[distillShortcut] AI call FAILED: ${aiError.message}`);
            throw new Error(`AI call failed: ${aiError.message}`);
        }

        if (!rawResponse || rawResponse.trim().length === 0) {
            this.logger.error('[distillShortcut] AI returned empty response');
            throw new Error('AI returned an empty response. Please try again.');
        }

        // Step 3: Extract JSON from response
        // AI sometimes wraps in ```json blocks or conversational text
        let jsonString = '';
        const codeBlockMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            jsonString = codeBlockMatch[1];
            this.logger.log('[distillShortcut] JSON extracted from code block');
        } else {
            const arrayStart = rawResponse.indexOf('[');
            const objectStart = rawResponse.indexOf('{');
            let firstIdx = -1;
            let lastIdx = -1;

            if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
                firstIdx = arrayStart;
                lastIdx = rawResponse.lastIndexOf(']');
            } else if (objectStart !== -1) {
                firstIdx = objectStart;
                lastIdx = rawResponse.lastIndexOf('}');
            }

            if (firstIdx !== -1 && lastIdx > firstIdx) {
                jsonString = rawResponse.substring(firstIdx, lastIdx + 1);
                this.logger.log('[distillShortcut] JSON extracted via structural search');
            }
        }

        if (!jsonString) {
            this.logger.error(`[distillShortcut] No JSON found in response. Full response: ${rawResponse}`);
            throw new Error('AI did not return JSON. Raw response logged for debugging.');
        }

        // Step 4: Parse JSON (with LaTeX backslash repair)
        let parsed: any;
        try {
            parsed = JSON.parse(jsonString.replace(/[\u200B-\u200D\uFEFF]/g, '').trim());
        } catch (firstErr) {
            this.logger.warn(`[distillShortcut] First parse attempt failed: ${firstErr.message}. Trying cleanup...`);
            try {
                const fixed = jsonString
                    .replace(/(?<!\\)\\(?![\\"/bfnrtu])/g, '\\\\')
                    .replace(/,\s*([\]}])/g, '$1');
                parsed = JSON.parse(fixed);
            } catch (e) {
                this.logger.error(`[distillShortcut] JSON parse failed after cleanup. JSON string: ${jsonString.substring(0, 500)}`);
                throw new Error(`JSON parse failed: ${e.message}`);
            }
        }

        // Step 5: Normalise keys (handle Topic/topic/title/subject etc.)
        const rawResults = Array.isArray(parsed) ? parsed : [parsed];
        const validResults = rawResults.map(item => {
            const normalized: any = {};
            for (const key of Object.keys(item)) {
                const k = key.toLowerCase();
                const v = item[key];
                if (['topic', 'title', 'subject', 'name'].includes(k)) normalized.topic = v;
                else if (['formula', 'rule', 'shortcut', 'explanation', 'logic', 'content'].includes(k)) normalized.formula = v;
                else if (['keywords', 'tags', 'terms'].includes(k)) normalized.keywords = Array.isArray(v) ? v.join(', ') : v;
            }
            return normalized;
        }).filter(item => item.topic && item.formula);

        this.logger.log(`[distillShortcut] Valid shortcuts after normalisation: ${validResults.length}`);

        if (validResults.length === 0) {
            this.logger.error(`[distillShortcut] Parsed JSON had no matching fields. Parsed data: ${JSON.stringify(parsed).substring(0, 500)}`);
            throw new Error('AI returned data but no valid shortcuts matched the required schema (topic + formula).');
        }

        // Step 6: Auto-save to DB with embeddings
        const savedShortcuts = await Promise.all(validResults.map(async (item) => {
            try {
                let embedding = null;
                try {
                    const arr = await this.aiService.generateEmbedding(`${item.topic} ${item.keywords || ''} ${item.formula}`);
                    embedding = `[${arr.join(',')}]`;
                } catch (e) {
                    this.logger.warn(`[distillShortcut] Embedding failed for "${item.topic}": ${e.message}`);
                }

                const shortcut = this.shortcutRepository.create({
                    topic: item.topic,
                    formula: item.formula,
                    keywords: item.keywords || '',
                    embedding,
                    isActive: true,
                });
                return await this.shortcutRepository.save(shortcut);
            } catch (e) {
                this.logger.error(`[distillShortcut] DB save failed for "${item.topic}": ${e.message}`);
                return null;
            }
        }));

        const saved = savedShortcuts.filter(s => s !== null);
        this.logger.log(`[distillShortcut] DONE — saved ${saved.length}/${validResults.length} shortcuts to DB`);
        return saved;
    }
}
