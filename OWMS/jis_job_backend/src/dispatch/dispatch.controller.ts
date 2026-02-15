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
        return this.dispatchService.create(req.user.userId, createDto);
    }

    @Get()
    findAll(@Query('start') start?: string, @Query('end') end?: string) {
        return this.dispatchService.findAll(start, end);
    }

    @Get('my')
    findMyDispatches(@Request() req: any) {
        return this.dispatchService.findMyDispatches(req.user.userId);
    }

    @Patch(':id/cancel')
    cancel(@Request() req: any, @Param('id') id: string) {
        return this.dispatchService.cancel(+id, req.user.userId);
    }
}
