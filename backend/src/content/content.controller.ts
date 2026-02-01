import { Controller, Post, Get, Body, UseInterceptors, UploadedFile, Res, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ContentService } from './content.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('admin/content')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class ContentController {
    constructor(private readonly contentService: ContentService) { }

    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    async importQuestions(@UploadedFile() file: any) {
        if (!file) {
            throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
        }
        if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
            throw new HttpException('Only CSV files are allowed', HttpStatus.BAD_REQUEST);
        }

        try {
            const result = await this.contentService.importQuestions(file.buffer) as any;
            return {
                success: true,
                message: `Successfully imported ${result.importedCount} questions`,
                errors: result.errors
            };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Get('export')
    async exportQuestions(@Res() res: Response) {
        try {
            const csvStream = this.contentService.exportQuestions();

            res.header('Content-Type', 'text/csv');
            res.header('Content-Disposition', 'attachment; filename=questions_export.csv');

            csvStream.pipe(res);

            csvStream.on('error', (err) => {
                console.error('Export stream error:', err);
                if (!res.headersSent) {
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error generating export');
                }
            });
        } catch (error) {
            throw new HttpException('Failed to start export', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('duplicates')
    async checkDuplicates(@Body() body: { questions: string[] }) {
        if (!body.questions || !Array.isArray(body.questions)) {
            throw new HttpException('Questions array is required', HttpStatus.BAD_REQUEST);
        }

        try {
            const result = await this.contentService.checkForDuplicates(body.questions);
            return result;
        } catch (error) {
            throw new HttpException('Failed to check duplicates', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
