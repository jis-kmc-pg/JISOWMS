import { IsNumber, IsNotEmpty, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateReservationDto {
    @IsNumber()
    @IsNotEmpty({ message: '회의실 ID를 입력해주세요.' })
    roomId: number;

    @IsDateString()
    @IsNotEmpty({ message: '시작 시간을 입력해주세요.' })
    startDate: string;

    @IsDateString()
    @IsNotEmpty({ message: '종료 시간을 입력해주세요.' })
    endDate: string;

    @IsString()
    @IsNotEmpty({ message: '회의 제목을 입력해주세요.' })
    title: string;

    @IsOptional()
    @IsString()
    attendees?: string;
}
