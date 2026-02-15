import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDispatchDto } from './dto/create-dispatch.dto';

@Injectable()
export class DispatchService {
    constructor(private prisma: PrismaService) { }

    async create(userId: number, createDto: CreateDispatchDto) {
        const startDate = new Date(createDto.startDate);
        const endDate = new Date(createDto.endDate);

        // 1. 차량 중복 체크
        const vehicleConflict = await this.prisma.dispatch.findFirst({
            where: {
                vehicleId: createDto.vehicleId,
                status: { in: ['APPROVED'] },
                AND: [
                    { startDate: { lt: endDate } },
                    { endDate: { gt: startDate } }
                ]
            }
        });

        if (vehicleConflict) {
            throw new ConflictException('해당 시간대에 차량이 이미 예약되어 있습니다.');
        }

        // 2. 운전자 중복 체크 (동시간대 다른 차량 예약 불가)
        const userConflict = await this.prisma.dispatch.findFirst({
            where: {
                userId,
                status: { in: ['APPROVED'] },
                AND: [
                    { startDate: { lt: endDate } },
                    { endDate: { gt: startDate } }
                ]
            }
        });

        if (userConflict) {
            throw new ConflictException('같은 시간대에 이미 다른 예약이 있습니다.');
        }

        // 승인 상태로 생성
        return this.prisma.dispatch.create({
            data: {
                userId,
                vehicleId: createDto.vehicleId,
                startDate,
                endDate,
                destination: createDto.destination,
                purpose: createDto.purpose,
                passengers: createDto.passengers,
                status: 'APPROVED',
            },
            include: {
                vehicle: true,
                user: true,
            }
        });
    }

    async findAll(start?: string, end?: string) {
        // 타임라인 조회용 (기간 필터링)
        const whereClause: any = {
            status: { not: 'CANCELLED' }
        };

        if (start && end) {
            const s = new Date(start);
            const e = new Date(end);
            whereClause.AND = [
                { startDate: { lt: e } },
                { endDate: { gt: s } }
            ];
        }

        return this.prisma.dispatch.findMany({
            where: whereClause,
            include: {
                vehicle: true,
                user: {
                    select: { id: true, name: true, position: true }
                }
            },
            orderBy: { startDate: 'asc' }
        });
    }

    async findMyDispatches(userId: number) {
        return this.prisma.dispatch.findMany({
            where: { userId },
            include: { vehicle: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async cancel(id: number, userId: number) {
        const dispatch = await this.prisma.dispatch.findUnique({ where: { id } });
        if (!dispatch) throw new NotFoundException('예약 정보를 찾을 수 없습니다.');

        // 본인이거나 관리자(권한 체크는 Guard에서 처리하거나 여기서 Role 확인)
        // 여기서는 간단히 본인 여부만 체크하고, 추후 관리자 기능 추가 시 보완
        // Role 정보가 필요하면 User를 조회하거나 Request User 정보를 활용해야 함.
        // 일단 본인만 취소 가능하게.
        if (dispatch.userId !== userId) {
            // TODO: 관리자 권한 확인 로직 추가 필요
            throw new ForbiddenException('본인의 예약만 취소할 수 있습니다.');
        }

        return this.prisma.dispatch.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
    }
}
