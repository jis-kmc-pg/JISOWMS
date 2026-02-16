import { IsString, IsNotEmpty, IsDateString, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class TeamStatusItemDto {
    @IsString()
    @IsIn(['ISSUE', 'COLLECTION', 'ORDER', 'DEVELOPMENT', 'SALES', 'REVENUE'], {
        message: '항목은 ISSUE, COLLECTION, ORDER, DEVELOPMENT, SALES, REVENUE 중 하나여야 합니다.',
    })
    category: string;

    @IsDateString({}, { message: '유효한 날짜를 입력해주세요.' })
    itemDate: string;

    @IsString()
    @IsNotEmpty({ message: '내용을 입력해주세요.' })
    content: string;
}

export class CreateTeamStatusDto {
    @IsDateString({}, { message: '보고 날짜를 입력해주세요.' })
    reportDate: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TeamStatusItemDto)
    items: TeamStatusItemDto[];
}
