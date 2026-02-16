import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dispatch')
@UseGuards(JwtAuthGuard)
export class DispatchController {
    constructor(private readonly dispatchService: DispatchService) { }

    @Post()
    create(@Request() req: any, @Body() createDto: CreateDispatchDto) {
        return this.dispatchService.create(req.user.id, createDto);
    }

    @Get()
    findAll(
        @Query('start') start?: string,
        @Query('end') end?: string,
        @Query('teamId') teamId?: string,
        @Query('deptId') deptId?: string,
    ) {
        return this.dispatchService.findAll(start, end, teamId ? +teamId : undefined, deptId ? +deptId : undefined);
    }

    @Get('my')
    findMyDispatches(@Request() req: any) {
        return this.dispatchService.findMyDispatches(req.user.id);
    }

    @Patch(':id/cancel')
    cancel(@Param('id') id: string) {
        return this.dispatchService.cancel(+id);
    }
}
