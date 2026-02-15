import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        position: true,
        role: true,
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        // Exclude password and refreshToken
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: number,
    data: { name?: string; dept?: string; email?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        position: true,
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });
  }

  async changePassword(userId: number, currentPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(currentPass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: '비밀번호가 변경되었습니다.' };
  }
  async searchUsers(query: string) {
    const whereClause = query
      ? {
          OR: [
            { name: { contains: query } },
            { department: { name: { contains: query } } },
          ],
        }
      : {};

    return this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        position: true,
        department: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
}
