import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BoardService } from './board.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('board')
@UseGuards(JwtAuthGuard)
export class BoardController {
    constructor(private readonly boardService: BoardService) { }

    @Get()
    findAllBoards() {
        return this.boardService.findAllBoards();
    }

    @Get(':name/posts')
    getPosts(
        @Param('name') name: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ) {
        return this.boardService.getPosts(name, +page, +limit);
    }

    @Post(':name/posts')
    createPost(
        @Request() req: any,
        @Param('name') name: string,
        @Body() createPostDto: CreatePostDto
    ) {
        return this.boardService.createPost(req.user.userId, name, createPostDto);
    }
}
