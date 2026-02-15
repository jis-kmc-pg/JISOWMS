import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { PrismaService } from '../prisma.service';

describe('MetricsService', () => {
  let service: MetricsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            vacation: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            department: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should throw error when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getDashboardStats(999)).rejects.toThrow(
        'User not found',
      );
    });

    it('should return company stats for CEO role', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'CEO',
        departmentId: null,
        teamId: null,
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(50);
      (prisma.vacation.count as jest.Mock).mockResolvedValue(3);
      (prisma.user.groupBy as jest.Mock).mockResolvedValue([
        { departmentId: 1, _count: { _all: 20 } },
        { departmentId: 2, _count: { _all: 30 } },
      ]);
      (prisma.department.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: '개발팀' },
        { id: 2, name: '기획팀' },
      ]);

      const result = await service.getDashboardStats(1);

      expect(result.scope).toBe('COMPANY');
      expect(result.kpi.totalEmployees).toBe(50);
      expect(result.kpi.todayOnLeave).toBe(3);
      expect(result.charts.deptUsage).toHaveLength(2);
    });

    it('should return company stats for EXECUTIVE role', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'EXECUTIVE',
        departmentId: null,
        teamId: null,
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(50);
      (prisma.vacation.count as jest.Mock).mockResolvedValue(0);
      (prisma.user.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.department.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getDashboardStats(1);

      expect(result.scope).toBe('COMPANY');
    });

    it('should return department stats for DEPT_HEAD role', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'DEPT_HEAD',
        departmentId: 1,
        teamId: null,
      });
      (prisma.user.count as jest.Mock).mockResolvedValue(15);
      (prisma.vacation.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getDashboardStats(1);

      expect(result.scope).toBe('DEPARTMENT');
      expect(result.kpi.deptMembers).toBe(15);
      expect(result.kpi.todayOnLeave).toBe(2);
    });

    it('should return error when DEPT_HEAD has no department', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'DEPT_HEAD',
        departmentId: null,
        teamId: null,
      });

      const result = await service.getDashboardStats(1);

      expect(result.scope).toBe('DEPARTMENT');
      expect(result.error).toBe('No Department Assigned');
    });

    it('should return team stats for TEAM_LEAD role', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'TEAM_LEAD',
        departmentId: 1,
        teamId: 1,
      });
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          name: '김철수',
          position: '대리',
          vacations: [],
          jobs: [],
        },
      ]);

      const result = await service.getDashboardStats(1);

      expect(result.scope).toBe('TEAM');
      expect(result.members).toHaveLength(1);
    });

    it('should return error when TEAM_LEAD has no team', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'TEAM_LEAD',
        departmentId: 1,
        teamId: null,
      });

      const result = await service.getDashboardStats(1);

      expect(result.scope).toBe('TEAM');
      expect(result.error).toBe('No Team Assigned');
    });

    it('should return personal stats for MEMBER role', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'MEMBER',
        departmentId: 1,
        teamId: 1,
      });
      (prisma.vacation.findMany as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getDashboardStats(1);

      expect(result.scope).toBe('PERSONAL');
      expect(result.kpi).toHaveProperty('usedDays');
      expect(result.kpi).toHaveProperty('remainingDays');
    });
  });
});
