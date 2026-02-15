import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEAM_LEADER', 'DEPT_HEAD', 'EXECUTIVE', 'CEO')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== 부서 관리 ====================

  @Get('departments')
  async getDepartments() {
    return this.adminService.getDepartments();
  }

  @Post('departments')
  async createDepartment(@Body() body: { name: string }) {
    return this.adminService.createDepartment(body.name);
  }

  @Patch('departments/:id')
  async updateDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name: string },
  ) {
    return this.adminService.updateDepartment(id, body.name);
  }

  // ==================== 팀 관리 ====================

  @Get('teams')
  async getTeams() {
    return this.adminService.getTeams();
  }

  @Post('teams')
  async createTeam(@Body() body: { name: string; departmentId: number }) {
    return this.adminService.createTeam(body.name, body.departmentId);
  }

  @Patch('teams/:id')
  async updateTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; departmentId?: number },
  ) {
    return this.adminService.updateTeam(id, body);
  }

  // ==================== 사용자 관리 ====================

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users')
  async createUser(
    @Body()
    body: {
      userId: string;
      name: string;
      position?: string;
      role?: Role;
      departmentId?: number;
      teamId?: number;
      email?: string;
    },
  ) {
    return this.adminService.createUser(body);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      name?: string;
      position?: string;
      role?: Role;
      departmentId?: number | null;
      teamId?: number | null;
      email?: string;
    },
  ) {
    return this.adminService.updateUser(id, body);
  }

  @Post('users/:id/reset-password')
  async resetPassword(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.resetPassword(id);
  }

  @Post('teams/:id/promote')
  async promoteTeamToDepartment(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.promoteTeamToDepartment(id);
  }

  @Post('departments/:id/demote')
  async demoteDepartmentToTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body('targetDeptId', ParseIntPipe) targetDeptId: number,
  ) {
    return this.adminService.demoteDepartmentToTeam(id, targetDeptId);
  }

  @Delete('departments/:id')
  async deleteDepartment(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteDepartment(id);
  }

  @Delete('teams/:id')
  async deleteTeam(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteTeam(id);
  }

  @Post('departments/:id/reorder')
  async reorderDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body('direction') direction: 'up' | 'down',
  ) {
    return this.adminService.updateDepartmentOrder(id, direction);
  }

  @Post('teams/:id/reorder')
  async reorderTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body('direction') direction: 'up' | 'down',
  ) {
    return this.adminService.updateTeamOrder(id, direction);
  }
}
