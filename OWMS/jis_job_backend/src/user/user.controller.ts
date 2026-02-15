import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard) // Protect all routes
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@Req() req: RequestWithUser) {
    return this.userService.getProfile(req.user.sub);
  }

  @Patch('me')
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() body: { name?: string; email?: string },
  ) {
    return this.userService.updateProfile(req.user.sub, body);
  }

  @Patch('me/password')
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() body: { currentPass: string; newPass: string },
  ) {
    return this.userService.changePassword(
      req.user.sub,
      body.currentPass,
      body.newPass,
    );
  }
  @Get('search')
  async searchUsers(@Req() req: RequestWithUser) {
    const query = req.query.q as string;
    if (!query) return [];
    return this.userService.searchUsers(query);
  }
}
