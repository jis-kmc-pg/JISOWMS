import { Injectable, NotFoundException, ForbiddenException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class BoardService implements OnModuleInit {
    private readonly logger = new Logger(BoardService.name);
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        const boards = [
            { name: 'notice', displayName: '공지사항' },
            { name: 'free', displayName: '자유게시판' },
            { name: 'qna', displayName: '질의응답' },
            { name: 'issue', displayName: '이슈게시판' },
        ];

        for (const board of boards) {
            const existing = await this.prisma.board.findUnique({ where: { name: board.name } });
            if (!existing) {
                await this.prisma.board.create({ data: board });
                this.logger.log(`Auto-created board: ${board.displayName}`);
            }
        }
    }

    // --- Board ---
    async findAllBoards() {
        return this.prisma.board.findMany({
            orderBy: { id: 'asc' }
        });
    }

    async findBoardByName(name: string) {
        return this.prisma.board.findUnique({
            where: { name }
        });
    }

    // --- Post ---
    async getPosts(boardName: string, page: number = 1, limit: number = 10) {
        const board = await this.findBoardByName(boardName);
        if (!board) throw new NotFoundException('게시판을 찾을 수 없습니다.');

        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where: { boardId: board.id },
                include: {
                    user: { select: { id: true, name: true, position: true } },
                    _count: { select: { comments: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.post.count({ where: { boardId: board.id } })
        ]);

        return {
            data: posts,
            meta: {
                total,
                page,
                last_page: Math.ceil(total / limit)
            }
        };
    }

    async createPost(userId: number, boardName: string, createPostDto: CreatePostDto) {
        const board = await this.findBoardByName(boardName);
        if (!board) throw new NotFoundException('게시판을 찾을 수 없습니다.');

        return this.prisma.post.create({
            data: {
                title: createPostDto.title,
                content: createPostDto.content,
                userId,
                boardId: board.id
            }
        });
    }

    async findPost(id: number) {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, position: true } },
                comments: {
                    include: {
                        user: { select: { id: true, name: true, position: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                board: true
            }
        });
        if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');

        // 조회수 증가 (비동기 처리 가능)
        await this.prisma.post.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
        });

        return post;
    }

    async deletePost(id: number, userId: number) {
        const post = await this.prisma.post.findUnique({ where: { id } });
        if (!post) throw new NotFoundException('게시글이 존재하지 않습니다.');

        // 권한 체크 (본인 또는 관리자)
        if (post.userId !== userId) {
            throw new ForbiddenException('작성자만 삭제할 수 있습니다.');
        }

        // 댓글 먼저 삭제해야 할 수도 있음 (Cascade 설정 있다면 자동이지만 안전하게)
        await this.prisma.comment.deleteMany({ where: { postId: id } });

        return this.prisma.post.delete({ where: { id } });
    }

    // --- Comment ---
    async createComment(userId: number, postId: number, createCommentDto: CreateCommentDto) {
        return this.prisma.comment.create({
            data: {
                content: createCommentDto.content,
                postId,
                userId
            },
            include: {
                user: { select: { id: true, name: true } }
            }
        });
    }

    async deleteComment(id: number, userId: number) {
        const comment = await this.prisma.comment.findUnique({ where: { id } });
        if (!comment) throw new NotFoundException('댓글이 존재하지 않습니다.');

        if (comment.userId !== userId) {
            throw new ForbiddenException('작성자만 삭제할 수 있습니다.');
        }

        return this.prisma.comment.delete({ where: { id } });
    }
}
