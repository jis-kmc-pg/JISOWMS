import { Test, TestingModule } from '@nestjs/testing';
import { WorkStatusService } from './work-status.service';
import { PrismaService } from '../prisma.service';

describe('WorkStatusService', () => {
  let service: WorkStatusService;
  let prisma: PrismaService;

  const mockRequestUser = {
    id: 1,
    role: 'CEO',
    departmentId: 1,
    teamId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkStatusService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
            },
            job: {
              findMany: jest.fn(),
            },
            dailyStatus: {
              findMany: jest.fn(),
            },
            department: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<WorkStatusService>(WorkStatusService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWeeklyStatus', () => {
    it('should return 7 days of weekly status', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: '김철수', department: { name: '개발팀' }, team: { name: 'FE' } },
      ]);
      (prisma.job.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.dailyStatus.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getWeeklyStatus(mockRequestUser, '2026-02-15');

      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('dayOfWeek');
      expect(result[0]).toHaveProperty('users');
    });

    it('should mark user as DONE when job exists', async () => {
      const monday = new Date('2026-02-09T00:00:00Z');
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: '김철수', department: { name: '개발팀' }, team: null },
      ]);
      (prisma.job.findMany as jest.Mock).mockResolvedValue([
        { userId: 1, jobDate: monday },
      ]);
      (prisma.dailyStatus.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getWeeklyStatus(mockRequestUser, '2026-02-10');

      const mondayStatus = result.find((d) => d.users.some((u) => u.id === 1 && u.status === 'DONE'));
      expect(mondayStatus).toBeDefined();
    });

    it('should mark user as DONE when exempt status exists (연차)', async () => {
      const monday = new Date('2026-02-09T00:00:00Z');
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: '이영희', department: { name: '기획팀' }, team: null },
      ]);
      (prisma.job.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.dailyStatus.findMany as jest.Mock).mockResolvedValue([
        { userId: 1, date: monday, workType: '연차' },
      ]);

      const result = await service.getWeeklyStatus(mockRequestUser, '2026-02-10');

      const mondayStatus = result.find((d) => d.users.some((u) => u.id === 1 && u.status === 'DONE'));
      expect(mondayStatus).toBeDefined();
    });

    it('should mark user as MISSING when no job and no exempt status', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: '박민수', department: { name: '개발팀' }, team: null },
      ]);
      (prisma.job.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.dailyStatus.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getWeeklyStatus(mockRequestUser, '2026-02-10');

      const allMissing = result.every((d) =>
        d.users.every((u) => u.status === 'MISSING'),
      );
      expect(allMissing).toBe(true);
    });

    it('should filter by department for non-CEO roles', async () => {
      const deptUser = { ...mockRequestUser, role: 'TEAM_LEAD' };
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.job.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.dailyStatus.findMany as jest.Mock).mockResolvedValue([]);

      await service.getWeeklyStatus(deptUser, '2026-02-10');

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ departmentId: 1 }),
        }),
      );
    });

    it('should filter by teamId when specified', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.job.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.dailyStatus.findMany as jest.Mock).mockResolvedValue([]);

      await service.getWeeklyStatus(mockRequestUser, '2026-02-10', 5);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ teamId: 5 }),
        }),
      );
    });
  });

  describe('getWeeklyDetail', () => {
    it('should return daily job details for a user', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          title: '개발 업무',
          content: '상세 내용',
          project: { projectName: '프로젝트A' },
          order: 1,
        },
        {
          id: 2,
          title: '회의',
          content: '팀 회의',
          project: null,
          order: 2,
        },
      ]);

      const result = await service.getWeeklyDetail('2026-02-15', 1);

      expect(result).toHaveLength(2);
      expect(result[0].projectName).toBe('프로젝트A');
      expect(result[1].projectName).toBe('기타 업무');
    });

    it('should return empty array when no jobs exist', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getWeeklyDetail('2026-02-15', 1);

      expect(result).toHaveLength(0);
    });
  });
});
