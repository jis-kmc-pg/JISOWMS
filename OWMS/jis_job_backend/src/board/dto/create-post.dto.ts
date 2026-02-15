import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePostDto {
    @IsString()
    @IsNotEmpty({ message: '제목을 입력해주세요.' })
    title: string;

    @IsString()
    @IsNotEmpty({ message: '내용을 입력해주세요.' })
    content: string;
}

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty({ message: '댓글 내용을 입력해주세요.' })
    content: string;
}
