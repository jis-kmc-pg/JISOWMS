import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            job: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            vacation: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummary', () => {
    it('should return dashboard summary with all fields', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([
        { projectId: 1 },
        { projectId: 2 },
      ]);
      (prisma.job.count as jest.Mock).mockResolvedValue(10);
      (prisma.vacation.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { startDate: new Date(), endDate: new Date(), type: 'FULL' },
          { startDate: new Date(), endDate: new Date(), type: 'HALF_AM' },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.getSummary(1);

      expect(result).toHaveProperty('todayProjects', 2);
      expect(result).toHaveProperty('weeklyCompleted', 10);
      expect(result).toHaveProperty('leaveBalance', 15);
      expect(result).toHaveProperty('leaveUsed');
      expect(result).toHaveProperty('remainingLeave');
      expect(result).toHaveProperty('teamAbsence');
    });

    it('should calculate half-day leave as 0.5', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.job.count as jest.Mock).mockResolvedValue(0);
      (prisma.vacation.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { startDate: new Date(), endDate: new Date(), type: 'HALF_AM' },
          { startDate: new Date(), endDate: new Date(), type: 'HALF_PM' },
        ])
        .mockResolvedValueOnce([]);

      const result = await service.getSummary(1);

      expect(result.leaveUsed).toBe(1);
      expect(result.remainingLeave).toBe(14);
    });

    it('should map team absence types correctly', async () => {
      const today = new Date();
      (prisma.job.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.job.count as jest.Mock).mockResolvedValue(0);
      (prisma.vacation.findMany as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            startDate: new Date(today.getTime() - 86400000),
            endDate: new Date(today.getTime() + 86400000),
            type: 'HALF_AM',
            user: { name: '김철수' },
          },
          {
            startDate: new Date(today.getTime() - 86400000),
            endDate: new Date(today.getTime() + 86400000),
            type: 'HALF_PM',
            user: { name: '이영희' },
          },
          {
            startDate: new Date(today.getTime() - 86400000),
            endDate: new Date(today.getTime() + 86400000),
            type: 'FULL',
            user: { name: '박민수' },
          },
        ]);

      const result = await service.getSummary(1);

      expect(result.teamAbsence).toHaveLength(3);
      expect(result.teamAbsence[0].type).toBe('오전반차');
      expect(result.teamAbsence[1].type).toBe('오후반차');
      expect(result.teamAbsence[2].type).toBe('연차');
    });
  });

  describe('getRecentJobs', () => {
    it('should return recent jobs with project names', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          title: '테스트 업무',
          content: '내용',
          jobDate: new Date('2026-02-15'),
          project: { projectName: '프로젝트A' },
        },
      ]);

      const result = await service.getRecentJobs(1);

      expect(result).toHaveLength(1);
      expect(result[0].projectName).toBe('프로젝트A');
      expect(result[0].title).toBe('테스트 업무');
    });

    it('should use default project name when project is null', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          title: '일반 작업',
          content: '내용',
          jobDate: new Date('2026-02-15'),
          project: null,
        },
      ]);

      const result = await service.getRecentJobs(1);

      expect(result[0].projectName).toBe('일반 업무');
    });
  });
});
