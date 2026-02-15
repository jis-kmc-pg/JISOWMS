import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDbCheck() {
    try {
      const count = await this.prisma.user.count();
      return { status: 'ok', count };
    } catch (error: any) {
      return { status: 'error', error: error.message };
    }
  }
}
