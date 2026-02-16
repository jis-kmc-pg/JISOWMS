import {
    IsNotEmpty,
    IsString,
    IsArray,
    IsOptional,
    IsNumber,
    IsBoolean,
    ValidateNested,
    IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Allow } from 'class-validator';

export class JobItemDto {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsOptional()
    @IsString()
    tempId?: string;

    @IsNotEmpty({ message: '업무 제목을 입력해주세요.' })
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsNumber({}, { message: '프로젝트 ID는 숫자여야 합니다.' })
    projectId?: number | null;

    @IsOptional()
    @IsBoolean()
    isIssue?: boolean;

    @IsOptional()
    @IsNumber()
    timeSpent?: number;

    @IsOptional()
    @IsBoolean()
    isCustomTitle?: boolean;

    // 서버에서 GET 응답에 포함된 필드들 — 프론트엔드가 그대로 재전송하므로 whitelist 허용
    @Allow()
    jobDate?: any;

    @Allow()
    jobType?: any;

    @Allow()
    userId?: any;

    @Allow()
    order?: any;

    @Allow()
    createdAt?: any;

    @Allow()
    updatedAt?: any;

    @Allow()
    project?: any;
}

export class SaveJobsDto {
    @IsNotEmpty({ message: '날짜를 입력해주세요.' })
    @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다. (예: 2026-02-20)' })
    date: string;

    @IsArray({ message: '업무 목록은 배열이어야 합니다.' })
    @ValidateNested({ each: true })
    @Type(() => JobItemDto)
    jobs: JobItemDto[];
}
