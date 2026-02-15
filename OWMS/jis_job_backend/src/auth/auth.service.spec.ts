import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: 1,
    userId: 'testuser',
    name: 'Test User',
    email: 'test@test.com',
    password: '$2b$10$hashedpassword',
    role: 'MEMBER',
    departmentId: 1,
    teamId: 1,
    refreshToken: null,
    department: { name: 'Dev' },
    team: { name: 'Frontend' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-jwt-secret';
              if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password and refreshToken on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const userWithHash = { ...mockUser, password: hashedPassword };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithHash);

      const result = await service.validateUser('testuser', 'correctpassword');

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
      expect(result.id).toBe(1);
      expect(result.userId).toBe('testuser');
      expect(result.department).toEqual({ name: 'Dev' });
      expect(result.team).toEqual({ name: 'Frontend' });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { userId: 'testuser' },
        include: {
          department: { select: { name: true } },
          team: { select: { name: true } },
        },
      });
    });

    it('should return null on invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const userWithHash = { ...mockUser, password: hashedPassword };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithHash);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return tokens and user data', async () => {
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const loginUser = {
        id: 1,
        userId: 'testuser',
        role: 'MEMBER',
        departmentId: 1,
      };

      const result = await service.login(loginUser);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).toEqual(loginUser);
    });

    it('should call updateRefreshToken with hashed token', async () => {
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await service.login({
        id: 1,
        userId: 'testuser',
        role: 'MEMBER',
        departmentId: 1,
      });

      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: 1 });
      // refreshToken in DB should be a bcrypt hash, not the raw token
      expect(updateCall.data.refreshToken).not.toBe('refresh-token');
      const isHashed = await bcrypt.compare(
        'refresh-token',
        updateCall.data.refreshToken,
      );
      expect(isHashed).toBe(true);
    });
  });

  describe('logout', () => {
    it('should set refreshToken to null', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await service.logout(1);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { refreshToken: null },
      });
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.refreshTokens(1, 'token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when no stored refresh token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        refreshToken: null,
      });

      await expect(service.refreshTokens(1, 'token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when refresh token does not match', async () => {
      const hashedToken = await bcrypt.hash('stored-token', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        refreshToken: hashedToken,
      });

      await expect(
        service.refreshTokens(1, 'wrong-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return new tokens when refresh token matches', async () => {
      const storedToken = 'valid-refresh-token';
      const hashedToken = await bcrypt.hash(storedToken, 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        refreshToken: hashedToken,
      });
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.refreshTokens(1, storedToken);

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should update stored refresh token after successful refresh', async () => {
      const storedToken = 'valid-refresh-token';
      const hashedToken = await bcrypt.hash(storedToken, 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        refreshToken: hashedToken,
      });
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await service.refreshTokens(1, storedToken);

      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: 1 });
      const isHashed = await bcrypt.compare(
        'new-refresh-token',
        updateCall.data.refreshToken,
      );
      expect(isHashed).toBe(true);
    });
  });

  describe('getTokens', () => {
    it('should generate access and refresh tokens', async () => {
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');

      const result = await service.getTokens(1, 'testuser', 'MEMBER', 1);

      expect(result.accessToken).toBe('at');
      expect(result.refreshToken).toBe('rt');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('should sign access token with JWT_SECRET and 15m expiry', async () => {
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');

      await service.getTokens(1, 'testuser', 'MEMBER', 1);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 1, userId: 'testuser', role: 'MEMBER', departmentId: 1 },
        { secret: 'test-jwt-secret', expiresIn: '15m' },
      );
    });

    it('should sign refresh token with JWT_REFRESH_SECRET and 7d expiry', async () => {
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');

      await service.getTokens(1, 'testuser', 'MEMBER', 1);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 1, userId: 'testuser', role: 'MEMBER', departmentId: 1 },
        { secret: 'test-refresh-secret', expiresIn: '7d' },
      );
    });

    it('should handle null departmentId', async () => {
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');

      const result = await service.getTokens(1, 'testuser', 'ADMIN', null);

      expect(result.accessToken).toBe('at');
      expect(result.refreshToken).toBe('rt');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 1, userId: 'testuser', role: 'ADMIN', departmentId: null },
        expect.any(Object),
      );
    });
  });

  describe('updateRefreshToken', () => {
    it('should hash the token and store it', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await service.updateRefreshToken(1, 'raw-token');

      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: 1 });
      // Verify the stored value is a bcrypt hash of the raw token
      const isMatch = await bcrypt.compare(
        'raw-token',
        updateCall.data.refreshToken,
      );
      expect(isMatch).toBe(true);
    });
  });
});
