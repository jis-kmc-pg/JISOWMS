import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export class UpdateVehicleDto {
    @IsOptional()
    @IsString()
    modelName?: string;

    @IsOptional()
    @IsString()
    licensePlate?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsNumber()
    year?: number;

    @IsOptional()
    @IsNumber()
    capacity?: number;

    @IsOptional()
    @IsBoolean()
    hasNavi?: boolean;

    @IsOptional()
    @IsBoolean()
    hasBlackBox?: boolean;

    @IsOptional()
    @IsBoolean()
    hasHiPass?: boolean;

    @IsOptional()
    @IsNumber()
    minAge?: number;

    @IsOptional()
    @IsDateString()
    contractStartDate?: string;

    @IsOptional()
    @IsDateString()
    contractEndDate?: string;

    @IsOptional()
    @IsNumber()
    monthlyRent?: number;

    @IsOptional()
    @IsNumber()
    deductible?: number;

    @IsOptional()
    @IsString()
    rentalCompany?: string;

    @IsOptional()
    @IsString()
    rentalContact?: string;

    @IsOptional()
    @IsNumber()
    departmentId?: number;
}
