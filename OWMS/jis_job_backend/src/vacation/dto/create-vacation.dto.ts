import { IsNotEmpty, IsString, IsOptional, IsIn, IsDateString } from 'class-validator';

export class CreateVacationDto {
    @IsNotEmpty({ message: '휴가 유형을 선택해주세요.' })
    @IsString()
    @IsIn(['ANNUAL', 'HALF_AM', 'HALF_PM', 'SICK', 'SPECIAL'], {
        message: '올바른 휴가 유형을 선택해주세요. (ANNUAL, HALF_AM, HALF_PM, SICK, SPECIAL)',
    })
    type: string;

    @IsNotEmpty({ message: '시작일을 입력해주세요.' })
    @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다. (예: 2026-02-20)' })
    startDate: string;

    @IsNotEmpty({ message: '종료일을 입력해주세요.' })
    @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다. (예: 2026-02-20)' })
    endDate: string;

    @IsOptional()
    @IsString()
    reason?: string;
}
