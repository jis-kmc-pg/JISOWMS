import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  const mockUser = {
    id: 1,
    userId: 'testuser',
    name: '김철수',
    email: 'test@test.com',
    position: '대리',
    role: 'MEMBER',
    password: '$2b$10$hashedpassword',
    department: { id: 1, name: '개발팀' },
    team: { id: 1, name: 'FE팀' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getProfile(1);

      expect(result.name).toBe('김철수');
      expect(result.department.name).toBe('개발팀');
    });

    it('should throw NotFoundException when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update user name and email', async () => {
      const updated = { ...mockUser, name: '이영희', email: 'new@test.com' };
      (prisma.user.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.updateProfile(1, {
        name: '이영희',
        email: 'new@test.com',
      });

      expect(result.name).toBe('이영희');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { name: '이영희', email: 'new@test.com' },
        }),
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const hashedOld = await bcrypt.hash('oldpass', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: hashedOld,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.changePassword(1, 'oldpass', 'newpass');

      expect(result.message).toBe('비밀번호가 변경되었습니다.');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.changePassword(999, 'old', 'new'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      const hashedOld = await bcrypt.hash('correctpass', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: hashedOld,
      });

      await expect(
        service.changePassword(1, 'wrongpass', 'newpass'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: '김철수', position: '대리', department: { name: '개발팀' } },
      ]);

      const result = await service.searchUsers('김');

      expect(result).toHaveLength(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should return all users when query is empty', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: '김철수', position: '대리', department: { name: '개발팀' } },
        { id: 2, name: '이영희', position: '사원', department: { name: '기획팀' } },
      ]);

      const result = await service.searchUsers('');

      expect(result).toHaveLength(2);
    });
  });
});
