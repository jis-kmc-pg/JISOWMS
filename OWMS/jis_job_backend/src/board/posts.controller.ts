import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
    constructor(private readonly boardService: BoardService) { }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.boardService.findPost(+id);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.boardService.deletePost(+id, req.user.userId);
    }

    @Post(':id/comments')
    createComment(
        @Request() req: any,
        @Param('id') id: string,
        @Body() createCommentDto: CreateCommentDto
    ) {
        return this.boardService.createComment(req.user.userId, +id, createCommentDto);
    }

    // 댓글 삭제 API 추가 (필요 시)
    @Delete('comments/:id')
    removeComment(@Request() req: any, @Param('id') id: string) {
        return this.boardService.deleteComment(+id, req.user.userId);
    }
}
