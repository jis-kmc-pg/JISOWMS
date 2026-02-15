import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: {
            job: {
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
            weeklyNote: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              upsert: jest.fn(),
            },
            project: {
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            dailyStatus: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              upsert: jest.fn(),
            },
            $queryRaw: jest.fn(),
            $executeRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getJobsByDate', () => {
    it('should query jobs for specific user and date', async () => {
      const mockJobs = [
        { id: 1, title: 'Task 1', content: 'Content', project: null },
      ];
      (prisma.job.findMany as jest.Mock).mockResolvedValue(mockJobs);

      const result = await service.getJobsByDate(1, '2026-03-02');

      expect(result).toEqual(mockJobs);
      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
          }),
          include: { project: true },
          orderBy: { order: 'asc' },
        }),
      );
    });
  });

  describe('saveWeeklyNote', () => {
    it('should throw when content exceeds 4 lines', async () => {
      const content = 'line1\nline2\nline3\nline4\nline5';

      await expect(
        service.saveWeeklyNote(1, '2026-03-02', content),
      ).rejects.toThrow('주간 정보 사항은 최대 4줄까지만 입력 가능합니다.');
    });

    it('should throw when a line exceeds 40 characters', async () => {
      const content = 'a'.repeat(41);

      await expect(
        service.saveWeeklyNote(1, '2026-03-02', content),
      ).rejects.toThrow('주간 정보 사항의 각 줄은 최대 40자까지 입력 가능합니다.');
    });

    it('should upsert valid weekly note', async () => {
      const content = '정상적인 메모';
      (prisma.weeklyNote.upsert as jest.Mock).mockResolvedValue({
        id: 1,
        content,
      });

      const result = await service.saveWeeklyNote(1, '2026-03-02', content);

      expect(prisma.weeklyNote.upsert).toHaveBeenCalled();
      expect(result.content).toBe(content);
    });

    it('should allow empty content', async () => {
      (prisma.weeklyNote.upsert as jest.Mock).mockResolvedValue({
        id: 1,
        content: '',
      });

      await service.saveWeeklyNote(1, '2026-03-02', '');

      expect(prisma.weeklyNote.upsert).toHaveBeenCalled();
    });
  });

  describe('getProjects', () => {
    it('should return ACTIVE projects by default', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

      await service.getProjects();

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return all projects when status is ALL', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

      await service.getProjects('ALL');

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by specific status', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

      await service.getProjects('COMPLETED');

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('createProject', () => {
    it('should create project with ACTIVE status', async () => {
      (prisma.project.create as jest.Mock).mockResolvedValue({
        id: 1,
        projectName: 'New Project',
        status: 'ACTIVE',
      });

      const result = await service.createProject({
        projectName: 'New Project',
        clientName: 'Client',
      });

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          projectName: 'New Project',
          clientName: 'Client',
          status: 'ACTIVE',
        },
      });
    });
  });

  describe('searchPastJobs', () => {
    it('should return empty array when dates are missing', async () => {
      const result = await service.searchPastJobs(1, '', '');
      expect(result).toEqual([]);
    });

    it('should search jobs within date range with limit 100', async () => {
      (prisma.job.findMany as jest.Mock).mockResolvedValue([]);

      await service.searchPastJobs(1, '2026-01-01', '2026-03-01');

      expect(prisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 1 }),
          include: { project: true },
          orderBy: { jobDate: 'desc' },
          take: 100,
        }),
      );
    });
  });

  describe('getSystemMemos', () => {
    it('should return empty array on query error', async () => {
      ((prisma as any).$queryRaw as jest.Mock).mockRejectedValue(
        new Error('DB Error'),
      );

      const result = await service.getSystemMemos('2026-03-02');

      expect(result).toEqual([]);
    });

    it('should return mapped results with user info', async () => {
      ((prisma as any).$queryRaw as jest.Mock).mockResolvedValue([
        {
          id: 1,
          content: 'Memo',
          userName: 'User1',
          userPosition: 'Manager',
        },
      ]);

      const result = await service.getSystemMemos('2026-03-02');

      expect(result[0].user.name).toBe('User1');
      expect(result[0].user.position).toBe('Manager');
    });
  });
});
