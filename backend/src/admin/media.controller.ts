import { Controller, Post, Get, Delete, Param, UseInterceptors, UploadedFile, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('admin/media')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Get()
    async getAllMedia() {
        try {
            return await this.mediaService.getAllFiles();
        } catch (error) {
            throw new HttpException('Failed to fetch media files', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadMedia(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
        }

        // Validate file type (images only)
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new HttpException('Only image files are allowed', HttpStatus.BAD_REQUEST);
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new HttpException('File size must not exceed 5MB', HttpStatus.BAD_REQUEST);
        }

        try {
            const mediaFile = await this.mediaService.uploadFile(file);
            return {
                success: true,
                message: 'File uploaded successfully',
                data: mediaFile
            };
        } catch (error) {
            throw new HttpException('Failed to upload file', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Delete(':id')
    async deleteMedia(@Param('id') id: string) {
        try {
            return await this.mediaService.deleteFile(id);
        } catch (error) {
            throw new HttpException(error.message || 'Failed to delete file', HttpStatus.NOT_FOUND);
        }
    }
}
