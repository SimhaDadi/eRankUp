import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MediaService {
    private readonly uploadDir = path.join(process.cwd(), 'uploads', 'media');

    constructor() {
        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async uploadFile(file: Express.Multer.File) {
        const fileId = uuidv4();
        const fileExt = path.extname(file.originalname);
        const filename = `${fileId}${fileExt}`;
        const filePath = path.join(this.uploadDir, filename);

        // Save file to disk
        fs.writeFileSync(filePath, file.buffer);

        const mediaFile = {
            id: fileId,
            filename: filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: filePath,
            url: `/uploads/media/${filename}`,
            uploadedAt: new Date()
        };

        return mediaFile;
    }

    async getAllFiles() {
        const files = fs.readdirSync(this.uploadDir);

        return files.map(filename => {
            const filePath = path.join(this.uploadDir, filename);
            const stats = fs.statSync(filePath);

            return {
                id: path.parse(filename).name,
                filename: filename,
                originalName: filename,
                mimetype: this.getMimeType(filename),
                size: stats.size,
                path: filePath,
                url: `/uploads/media/${filename}`,
                uploadedAt: stats.birthtime
            };
        });
    }

    async deleteFile(id: string) {
        const files = fs.readdirSync(this.uploadDir);
        const file = files.find(f => f.startsWith(id));

        if (!file) {
            throw new Error('File not found');
        }

        const filePath = path.join(this.uploadDir, file);
        fs.unlinkSync(filePath);

        return { success: true, message: 'File deleted successfully' };
    }

    private getMimeType(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
}
