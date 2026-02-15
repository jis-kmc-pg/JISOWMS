import { IsNumber, IsNotEmpty, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateDispatchDto {
    @IsNumber()
    @IsNotEmpty({ message: '차량 ID를 입력해주세요.' })
    vehicleId: number;

    @IsDateString()
    @IsNotEmpty({ message: '시작일을 입력해주세요.' })
    startDate: string; // ISO 8601 string

    @IsDateString()
    @IsNotEmpty({ message: '종료일을 입력해주세요.' })
    endDate: string;

    @IsOptional()
    @IsString()
    destination?: string;

    @IsOptional()
    @IsString()
    purpose?: string;

    @IsOptional()
    @IsString()
    passengers?: string;
}
