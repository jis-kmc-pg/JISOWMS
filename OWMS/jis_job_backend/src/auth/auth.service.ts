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
      user.teamId,
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
      user.teamId,
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
    teamId: number | null = null,
  ) {
    const payload = { sub: userId, userId: username, role, departmentId, teamId };
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        payload,
        { secret: this.configService.get<string>('JWT_SECRET'), expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        payload,
        { secret: this.configService.get<string>('JWT_REFRESH_SECRET'), expiresIn: '7d' },
      ),
    ]);
    return {
      accessToken: at,
      refreshToken: rt,
    };
  }

  /**
   * SSO 토큰 검증 및 새 토큰 발급
   * Tauri 앱에서 전달받은 JWT 토큰을 검증하고 웹용 쿠키 토큰 생성
   */
  async validateSsoToken(token: string) {
    try {
      // JWT 토큰 검증
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // 사용자 정보 조회
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          department: { select: { name: true } },
          team: { select: { name: true } },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // 새로운 토큰 발급 (웹 브라우저용)
      const tokens = await this.getTokens(
        user.id,
        user.userId,
        user.role,
        user.departmentId,
        user.teamId,
      );

      // Refresh Token을 DB에 저장
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      const { password, refreshToken, ...userWithoutSensitive } = user;

      return {
        ...tokens,
        user: userWithoutSensitive,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid SSO token');
    }
  }
}
