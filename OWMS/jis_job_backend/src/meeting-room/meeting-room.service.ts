import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MeetingRoomService {
    constructor(private prisma: PrismaService) { }

    // ── 회의실 CRUD ──

    async createRoom(dto: CreateRoomDto) {
        try {
            return await this.prisma.meetingRoom.create({ data: dto });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new ConflictException('이미 동일한 이름의 회의실이 존재합니다.');
            }
            throw e;
        }
    }

    async findAllRooms() {
        return this.prisma.meetingRoom.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    async updateRoom(id: number, dto: Partial<CreateRoomDto>) {
        return this.prisma.meetingRoom.update({
            where: { id },
            data: dto,
        });
    }

    async deleteRoom(id: number) {
        return this.prisma.meetingRoom.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // ── 예약 CRUD ──

    async createReservation(userId: number, dto: CreateReservationDto) {
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);

        // 시간 충돌 검증
        const conflict = await this.prisma.meetingRoomReservation.findFirst({
            where: {
                roomId: dto.roomId,
                status: { in: ['APPROVED'] },
                AND: [
                    { startDate: { lt: endDate } },
                    { endDate: { gt: startDate } },
                ],
            },
        });

        if (conflict) {
            throw new ConflictException('해당 시간대에 회의실이 이미 예약되어 있습니다.');
        }

        return this.prisma.meetingRoomReservation.create({
            data: {
                roomId: dto.roomId,
                userId,
                startDate,
                endDate,
                title: dto.title,
                attendees: dto.attendees,
                status: 'APPROVED',
            },
            include: {
                room: true,
                user: { select: { id: true, name: true, position: true } },
            },
        });
    }

    async findReservations(start?: string, end?: string, teamId?: number, deptId?: number) {
        const whereClause: any = {
            status: { not: 'CANCELLED' },
        };

        if (start && end) {
            const s = new Date(start);
            const e = new Date(end);
            // 날짜만 전달된 경우 해당 일 전체를 포함하도록 +1일
            if (!end.includes('T')) {
                e.setDate(e.getDate() + 1);
            }
            whereClause.AND = [
                { startDate: { lt: e } },
                { endDate: { gt: s } },
            ];
        }

        if (teamId) {
            whereClause.user = { ...whereClause.user, teamId };
        }
        if (deptId) {
            whereClause.user = { ...whereClause.user, departmentId: deptId };
        }

        return this.prisma.meetingRoomReservation.findMany({
            where: whereClause,
            include: {
                room: true,
                user: { select: { id: true, name: true, position: true } },
            },
            orderBy: { startDate: 'asc' },
        });
    }

    async findMyReservations(userId: number) {
        return this.prisma.meetingRoomReservation.findMany({
            where: { userId },
            include: { room: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async cancelReservation(id: number, userId: number) {
        const reservation = await this.prisma.meetingRoomReservation.findUnique({ where: { id } });
        if (!reservation) throw new NotFoundException('예약 정보를 찾을 수 없습니다.');

        if (reservation.userId !== userId) {
            throw new ForbiddenException('본인의 예약만 취소할 수 있습니다.');
        }

        return this.prisma.meetingRoomReservation.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }
}
