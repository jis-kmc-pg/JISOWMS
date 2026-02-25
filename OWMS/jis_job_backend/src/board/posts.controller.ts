import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
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

    @Patch(':id')
    update(@Request() req: any, @Param('id') id: string, @Body() updateData: { title?: string; content?: string }) {
        return this.boardService.updatePost(+id, req.user.id, updateData);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.boardService.deletePost(+id, req.user.id);
    }

    @Post(':id/comments')
    createComment(
        @Request() req: any,
        @Param('id') id: string,
        @Body() createCommentDto: CreateCommentDto
    ) {
        return this.boardService.createComment(req.user.id, +id, createCommentDto);
    }

    // 댓글 삭제 API 추가 (필요 시)
    @Delete('comments/:id')
    removeComment(@Request() req: any, @Param('id') id: string) {
        return this.boardService.deleteComment(+id, req.user.id);
    }
}
