import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';

@Controller('news')
export class NewsController {
    constructor(private readonly newsService: NewsService) { }

    @Post()
    create(@Body() createNewsDto: CreateNewsDto) {
        return this.newsService.create(createNewsDto);
    }

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('category') category: string
    ) {
        return this.newsService.findAll(Number(page), Number(limit), category);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.newsService.findOne(id);
    }
}
