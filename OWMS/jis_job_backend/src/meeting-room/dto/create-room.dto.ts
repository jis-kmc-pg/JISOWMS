import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class CreateRoomDto {
    @IsString()
    @IsNotEmpty({ message: '회의실 이름을 입력해주세요.' })
    name: string;

    @IsInt()
    @Min(1)
    capacity: number;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    description?: string;
}
