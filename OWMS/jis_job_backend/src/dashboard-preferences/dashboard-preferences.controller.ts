import { Controller, Get, Put, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { DashboardPreferencesService } from './dashboard-preferences.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard-preferences')
@UseGuards(JwtAuthGuard)
export class DashboardPreferencesController {
    constructor(private readonly service: DashboardPreferencesService) {}

    @Get()
    getPreferences(@Request() req: any) {
        return this.service.getPreferences(req.user.sub);
    }

    @Put()
    savePreferences(@Request() req: any, @Body() body: { layout: any[] }) {
        return this.service.savePreferences(req.user.sub, body.layout);
    }

    @Delete()
    resetPreferences(@Request() req: any) {
        return this.service.resetPreferences(req.user.sub);
    }
}
