import { Test, TestingModule } from '@nestjs/testing';
import { VacationService } from './vacation.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('VacationService', () => {
  let service: VacationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacationService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            vacation: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            vacationAdjustment: {
              findMany: jest.fn(),
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<VacationService>(VacationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummary', () => {
    it('should calculate vacation summary with default 15 days when no joinDate', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        joinDate: null,
        annualLeaveOverride: null,
        carryoverLeave: 0,
      });
      (prisma.vacation.findMany as jest.Mock).mockResolvedValue([]);
      ((prisma as any).vacationAdjustment.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getSummary(1);

      expect(result.total).toBe(15);
      expect(result.used).toBe(0);
      expect(result.remaining).toBe(15);
    });

    it('should use annualLeaveOverride when set', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        joinDate: new Date('2020-01-01'),
        annualLeaveOverride: 20,
        carryoverLeave: 2,
      });
      (prisma.vacation.findMany as jest.Mock).mockResolvedValue([]);
      ((prisma as any).vacationAdjustment.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getSummary(1);

      expect(result.total).toBe(22); // 20 override + 2 carryover
      expect(result.remaining).toBe(22);
    });

    it('should subtract used vacation days', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        joinDate: null,
        annualLeaveOverride: null,
        carryoverLeave: 0,
      });
      // 월~금 5일 연차
      (prisma.vacation.findMany as jest.Mock).mockResolvedValue([
        {
          startDate: new Date('2026-03-02'), // 월
          endDate: new Date('2026-03-06'), // 금
          type: 'ANNUAL',
          status: 'APPROVED',
        },
      ]);
      ((prisma as any).vacationAdjustment.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getSummary(1);

      expect(result.used).toBe(5);
      expect(result.remaining).toBe(10); // 15 - 5
    });

    it('should count half-day as 0.5', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        joinDate: null,
        annualLeaveOverride: null,
        carryoverLeave: 0,
      });
      (prisma.vacation.findMany as jest.Mock).mockResolvedValue([
        {
          startDate: new Date('2026-03-02'),
          endDate: new Date('2026-03-02'),
          type: 'HALF_AM',
          status: 'APPROVED',
        },
      ]);
      ((prisma as any).vacationAdjustment.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getSummary(1);

      expect(result.used).toBe(0.5);
      expect(result.remaining).toBe(14.5);
    });
  });

  describe('requestVacation', () => {
    it('should throw when end date is before start date', async () => {
      await expect(
        service.requestVacation(1, {
          type: 'ANNUAL',
          startDate: '2026-03-10',
          endDate: '2026-03-05',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when vacation overlaps', async () => {
      (prisma.vacation.findFirst as jest.Mock).mockResolvedValue({
        id: 99,
      });

      await expect(
        service.requestVacation(1, {
          type: 'ANNUAL',
          startDate: '2026-03-02',
          endDate: '2026-03-03',
        }),
      ).rejects.toThrow('이미 해당 기간에 신청된 휴가가 있습니다.');
    });

    it('should throw when insufficient remaining days', async () => {
      (prisma.vacation.findFirst as jest.Mock).mockResolvedValue(null);
      // getSummary mock chain
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        joinDate: null,
        annualLeaveOverride: null,
        carryoverLeave: 0,
      });
      // Already used 14.5 days
      (prisma.vacation.findMany as jest.Mock).mockResolvedValue([
        {
          startDate: new Date('2026-01-06'),
          endDate: new Date('2026-01-24'),
          type: 'ANNUAL',
          status: 'APPROVED',
        },
      ]);
      ((prisma as any).vacationAdjustment.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        service.requestVacation(1, {
          type: 'ANNUAL',
          startDate: '2026-03-02',
          endDate: '2026-03-06', // 5일 요청 but 남은 0.5일
        }),
      ).rejects.toThrow('잔여 연차가 부족합니다');
    });

    it('should create vacation when valid', async () => {
      (prisma.vacation.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        joinDate: null,
        annualLeaveOverride: null,
        carryoverLeave: 0,
      });
      (prisma.vacation.findMany as jest.Mock).mockResolvedValue([]);
      ((prisma as any).vacationAdjustment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.vacation.create as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 1,
        type: 'ANNUAL',
        startDate: new Date('2026-03-02'),
        endDate: new Date('2026-03-03'),
        status: 'PENDING',
      });

      const result = await service.requestVacation(1, {
        type: 'ANNUAL',
        startDate: '2026-03-02',
        endDate: '2026-03-03',
      });

      expect(result.status).toBe('PENDING');
      expect(prisma.vacation.create).toHaveBeenCalled();
    });
  });

  describe('deleteVacation', () => {
    it('should delete vacation by id', async () => {
      (prisma.vacation.delete as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await service.deleteVacation(1);

      expect(prisma.vacation.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('getMyVacations', () => {
    it('should return vacations sorted by startDate desc', async () => {
      const vacations = [
        { id: 2, startDate: new Date('2026-03-10') },
        { id: 1, startDate: new Date('2026-02-01') },
      ];
      (prisma.vacation.findMany as jest.Mock).mockResolvedValue(vacations);

      const result = await service.getMyVacations(1);

      expect(prisma.vacation.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { startDate: 'desc' },
      });
      expect(result).toEqual(vacations);
    });
  });
});
