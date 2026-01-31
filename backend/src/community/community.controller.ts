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
        return this.communityService.createPost(req.user.id, createPostDto);
    }

    @Get('feed')
    getFeed(
        @Request() req,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('category') category: string
    ) {
        return this.communityService.getFeed(req.user.id, Number(page), Number(limit), category);
    }

    @Post('posts/:id/like')
    toggleLike(@Request() req, @Param('id') id: string) {
        return this.communityService.toggleLike(req.user.id, id);
    }

    @Post('posts/:id/comments')
    addComment(@Request() req, @Param('id') id: string, @Body('content') content: string) {
        return this.communityService.addComment(req.user.id, id, content);
    }

    @Get('posts/:id/comments')
    getComments(@Param('id') id: string) {
        return this.communityService.getComments(id);
    }
}
