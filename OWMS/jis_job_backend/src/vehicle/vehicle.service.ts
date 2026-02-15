import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehicleService {
    constructor(private prisma: PrismaService) { }

    create(createVehicleDto: CreateVehicleDto) {
        const { contractStartDate, contractEndDate, ...rest } = createVehicleDto;
        return this.prisma.vehicle.create({
            data: {
                ...rest,
                contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
                contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
            },
        });
    }

    findAll() {
        return this.prisma.vehicle.findMany({
            include: {
                department: true,
            },
            orderBy: { id: 'asc' },
        });
    }

    findOne(id: number) {
        return this.prisma.vehicle.findUnique({
            where: { id },
            include: {
                department: true,
            },
        });
    }

    update(id: number, updateVehicleDto: UpdateVehicleDto) {
        const { contractStartDate, contractEndDate, ...rest } = updateVehicleDto;
        return this.prisma.vehicle.update({
            where: { id },
            data: {
                ...rest,
                ...(contractStartDate && { contractStartDate: new Date(contractStartDate) }),
                ...(contractEndDate && { contractEndDate: new Date(contractEndDate) }),
            },
        });
    }

    remove(id: number) {
        return this.prisma.vehicle.delete({
            where: { id },
        });
    }
}
