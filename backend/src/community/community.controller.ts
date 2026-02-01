import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
// Assuming AuthGuard is available
import { AuthGuard } from '@nestjs/passport';

@Controller('community')
@UseGuards(AuthGuard('jwt'))
export class CommunityController {
    constructor(private readonly communityService: CommunityService) { }

    @Post('posts')
    createPost(@Request() req, @Body() createPostDto: CreatePostDto) {
        return this.communityService.createPost(req.user.userId, createPostDto);
    }

    @Get('feed')
    getFeed(
        @Request() req,
        @Query('page') page: any = 1,
        @Query('limit') limit: any = 20,
        @Query('category') category: string
    ) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        return this.communityService.getFeed(req.user.userId, pageNum, limitNum, category);
    }

    @Post('posts/:id/like')
    toggleLike(@Request() req, @Param('id') id: string) {
        return this.communityService.toggleLike(req.user.userId, id);
    }

    @Post('posts/:id/comments')
    addComment(@Request() req, @Param('id') id: string, @Body('content') content: string) {
        return this.communityService.addComment(req.user.userId, id, content);
    }

    @Get('posts/:id/comments')
    getComments(@Param('id') id: string) {
        return this.communityService.getComments(id);
    }
}
