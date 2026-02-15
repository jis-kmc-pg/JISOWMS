import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { PostsController } from './posts.controller';

@Module({
    controllers: [BoardController, PostsController],
    providers: [BoardService],
})
export class BoardModule { }
