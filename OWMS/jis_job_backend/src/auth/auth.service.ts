import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async validateUser(userId: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        department: { select: { name: true } },
        team: { select: { name: true } },
      },
    });

    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, refreshToken, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const tokens = await this.getTokens(
      user.id,
      user.userId,
      user.role,
      user.departmentId,
    );
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return {
      user,
      ...tokens,
    };
  }

  async logout(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access Denied');

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) throw new UnauthorizedException('Access Denied');

    const tokens = await this.getTokens(
      user.id,
      user.userId,
      user.role,
      user.departmentId,
    );
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash },
    });
  }

  async getTokens(
    userId: number,
    username: string,
    role: string,
    departmentId: number | null,
  ) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, userId: username, role, departmentId },
        { secret: this.configService.get<string>('JWT_SECRET'), expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, userId: username, role, departmentId },
        { secret: this.configService.get<string>('JWT_REFRESH_SECRET'), expiresIn: '7d' },
      ),
    ]);
    return {
      accessToken: at,
      refreshToken: rt,
    };
  }
}
