import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MeetingRoomService } from './meeting-room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('meeting-room')
@UseGuards(JwtAuthGuard)
export class MeetingRoomController {
    constructor(private readonly service: MeetingRoomService) { }

    // ── 회의실 관리 (관리자) ──

    @Get()
    findAllRooms() {
        return this.service.findAllRooms();
    }

    @Post()
    createRoom(@Body() dto: CreateRoomDto) {
        return this.service.createRoom(dto);
    }

    @Patch(':id')
    updateRoom(@Param('id') id: string, @Body() dto: Partial<CreateRoomDto>) {
        return this.service.updateRoom(+id, dto);
    }

    @Delete(':id')
    deleteRoom(@Param('id') id: string) {
        return this.service.deleteRoom(+id);
    }

    // ── 예약 관리 ──

    @Get('reservation')
    findReservations(
        @Query('start') start?: string,
        @Query('end') end?: string,
        @Query('teamId') teamId?: string,
        @Query('deptId') deptId?: string,
    ) {
        return this.service.findReservations(start, end, teamId ? +teamId : undefined, deptId ? +deptId : undefined);
    }

    @Post('reservation')
    createReservation(@Request() req: any, @Body() dto: CreateReservationDto) {
        return this.service.createReservation(req.user.id, dto);
    }

    @Get('reservation/my')
    findMyReservations(@Request() req: any) {
        return this.service.findMyReservations(req.user.id);
    }

    @Patch('reservation/:id/cancel')
    cancelReservation(@Request() req: any, @Param('id') id: string) {
        return this.service.cancelReservation(+id, req.user.id);
    }
}
