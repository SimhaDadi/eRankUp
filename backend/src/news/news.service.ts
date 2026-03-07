import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsItem } from './entities/news.entity';
import { CreateNewsDto } from './dto/create-news.dto';

@Injectable()
export class NewsService implements OnModuleInit {
    constructor(
        @InjectRepository(NewsItem)
        private newsRepository: Repository<NewsItem>,
    ) { }

    async onModuleInit() {
        // Seed initial data if empty
        const count = await this.newsRepository.count();
        if (count === 0) {
            console.log('Seeding initial news data...');
            await this.seedData();
        }
    }

    async create(createNewsDto: CreateNewsDto): Promise<NewsItem> {
        const news = this.newsRepository.create(createNewsDto);
        return this.newsRepository.save(news);
    }

    async findAll(page: number = 1, limit: number = 10, category?: string): Promise<{ items: NewsItem[], total: number }> {
        // Validation/Normalization
        const p = Number(page) || 1;
        const l = Number(limit) || 10;
        const validPage = Math.max(1, p);
        const validLimit = Math.max(1, Math.min(100, l));
        const skip = (validPage - 1) * validLimit;

        const query = this.newsRepository.createQueryBuilder('news');

        if (category && category !== 'All') {
            query.where('news.category = :category', { category });
        }

        query.orderBy('news.publishedAt', 'DESC');
        query.skip(skip);
        query.take(validLimit);

        const [items, total] = await query.getManyAndCount();
        return { items, total };
    }

    async findOne(id: string): Promise<NewsItem> {
        return this.newsRepository.findOne({ where: { id } });
    }

    async update(id: string, updateData: Partial<CreateNewsDto>): Promise<NewsItem> {
        await this.newsRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.newsRepository.delete(id);
    }

    private async seedData() {
        const dummyNews: CreateNewsDto[] = [
            {
                title: "India's Space Mission: Gaganyaan Update",
                summary: "ISRO completes crucial engine tests for the upcoming human spaceflight mission.",
                content: "<p>The Indian Space Research Organisation (ISRO) has successfully conducted the qualification test of the cryogenic engine for the Gaganyaan mission. This marks a significant milestone in India's first human spaceflight programme. Ideally, the mission is scheduled for 2025.</p><p>Key details:</p><ul><li>Engine: CE20 Cryogenic Engine</li><li>Duration: 670 seconds</li><li>Location: Mahendragiri, Tamil Nadu</li></ul>",
                category: "Science & Tech",
                imageUrl: "https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=1000&auto=format&fit=crop",
                tags: ["ISRO", "Space", "Gaganyaan"],
                source: "ISRO Press Release"
            },
            {
                title: "Union Budget 2024: Highlights for Education Sector",
                summary: "Government announces new initiatives for digital literacy and skill development.",
                content: "<p>The Finance Minister presented the Union Budget 2024-25, emphasizing 'Viksit Bharat'. For the education sector, the allocation has been increased by 6.8%.</p><p>Major Announcements:</p><ul><li>Expansion of PM SHRI Schools</li><li>New Skill India Centers</li><li>Focus on AI and Robotics in localized languages</li></ul>",
                category: "National",
                imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000&auto=format&fit=crop",
                tags: ["Budget 2024", "Education", "Economy"],
                source: "PIB"
            },
            {
                title: "Asian Games 2026: Preparation Begins",
                summary: "Indian athletes start training camps for the upcoming games in Nagoya.",
                content: "<p>With the 2026 Asian Games in Aichi-Nagoya approaching, the Indian Olympic Association has laid out a comprehensive roadmap.</p>",
                category: "Sports",
                imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000&auto=format&fit=crop",
                tags: ["Asian Games", "Sports", "India"],
                source: "Sports Authority of India"
            },
            {
                title: "New Climate Policy Announced at COP Summit",
                summary: "Global leaders agree on a phased reduction of fossil fuels.",
                content: "<p>The COP summit concluded with a historic agreement. Nations have pledged to triple renewable energy capacity by 2030.</p>",
                category: "International",
                imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=1000&auto=format&fit=crop",
                tags: ["Environment", "COP", "Climate Change"],
                source: "UN News"
            }
        ];

        for (const news of dummyNews) {
            await this.create(news);
        }
    }
}
