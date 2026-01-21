import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';

@Injectable()
export class MediaService {
    constructor(
        @InjectRepository(Media)
        private mediaRepository: Repository<Media>,
    ) { }

    async uploadMedia(file: any) {
        // In a real app, upload to S3 or similar
        // Here we simulate by just returning a fake URL pointing to backend static serve if we had it
        // OR we can just store base64 in database if files are small (not recommended but easiest for prototype)
        // Let's assume we just return a placeholder URL for now, or use a local logic.

        // Actually, for this demo, let's just create a record assuming file is handled.

        // BETTER APPROACH: Return a dummy S3 url
        const filename = `${Date.now()}-${file.originalname}`;
        const url = `https://storage.example.com/erankup/${filename}`;

        const media = this.mediaRepository.create({
            filename: file.originalname,
            url: url,
            mimeType: file.mimetype,
            size: file.size
        });

        return this.mediaRepository.save(media);
    }

    async getAllMedia() {
        return this.mediaRepository.find({
            order: { createdAt: 'DESC' }
        });
    }

    async deleteMedia(id: string) {
        return this.mediaRepository.delete(id);
    }
}
