import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ==================== 부서 관리 ====================

  // 전체 부서 목록 (하위 팀 및 사용자 수 포함)
  async getDepartments() {
    return this.prisma.department.findMany({
      include: {
        teams: {
          include: {
            _count: { select: { users: true } },
          },
          orderBy: { orderIndex: 'asc' }, // 팀 순서 정렬
        },
        _count: { select: { users: true } },
      },
      orderBy: { orderIndex: 'asc' }, // 부서 순서 정렬
    });
  }

  // 부서 추가
  async createDepartment(name: string) {
    const exists = await this.prisma.department.findUnique({ where: { name } });
    if (exists) throw new BadRequestException('이미 존재하는 부서명입니다.');

    const lastDept = await this.prisma.department.findFirst({
      orderBy: { orderIndex: 'desc' },
    });
    const newOrderIndex = (lastDept?.orderIndex ?? 0) + 1;

    return this.prisma.department.create({
      data: { name, orderIndex: newOrderIndex },
    });
  }

  // 부서 수정
  async updateDepartment(id: number, name: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('부서를 찾을 수 없습니다.');
    return this.prisma.department.update({ where: { id }, data: { name } });
  }

  // ==================== 팀 관리 ====================

  // 전체 팀 목록 (소속 부서 포함)
  async getTeams() {
    return this.prisma.team.findMany({
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { users: true } },
      },
      orderBy: [{ department: { orderIndex: 'asc' } }, { orderIndex: 'asc' }],
    });
  }

  // 부서 순서 변경
  async updateDepartmentOrder(id: number, direction: 'up' | 'down') {
    const current = await this.prisma.department.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('부서를 찾을 수 없습니다.');

    const adjacent = await this.prisma.department.findFirst({
      where: {
        orderIndex:
          direction === 'up'
            ? { lt: current.orderIndex }
            : { gt: current.orderIndex },
      },
      orderBy: { orderIndex: direction === 'up' ? 'desc' : 'asc' },
    });

    if (!adjacent) return { message: '변경할 순서가 없습니다.' };

    await this.prisma.$transaction([
      this.prisma.department.update({
        where: { id: current.id },
        data: { orderIndex: adjacent.orderIndex },
      }),
      this.prisma.department.update({
        where: { id: adjacent.id },
        data: { orderIndex: current.orderIndex },
      }),
    ]);

    return { message: '부서 순서가 변경되었습니다.' };
  }

  // 팀 순서 변경
  async updateTeamOrder(id: number, direction: 'up' | 'down') {
    const current = await this.prisma.team.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('팀을 찾을 수 없습니다.');

    const adjacent = await this.prisma.team.findFirst({
      where: {
        departmentId: current.departmentId,
        orderIndex:
          direction === 'up'
            ? { lt: current.orderIndex }
            : { gt: current.orderIndex },
      },
      orderBy: { orderIndex: direction === 'up' ? 'desc' : 'asc' },
    });

    if (!adjacent) return { message: '변경할 순서가 없습니다.' };

    await this.prisma.$transaction([
      this.prisma.team.update({
        where: { id: current.id },
        data: { orderIndex: adjacent.orderIndex },
      }),
      this.prisma.team.update({
        where: { id: adjacent.id },
        data: { orderIndex: current.orderIndex },
      }),
    ]);

    return { message: '팀 순서가 변경되었습니다.' };
  }

  // 팀 추가
  async createTeam(name: string, departmentId: number) {
    const dept = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!dept) throw new NotFoundException('부서를 찾을 수 없습니다.');

    const lastTeam = await this.prisma.team.findFirst({
      where: { departmentId },
      orderBy: { orderIndex: 'desc' },
    });
    const newOrderIndex = (lastTeam?.orderIndex ?? 0) + 1;

    return this.prisma.team.create({
      data: { name, departmentId, orderIndex: newOrderIndex },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  // 팀 수정
  async updateTeam(id: number, data: { name?: string; departmentId?: number }) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException('팀을 찾을 수 없습니다.');
    return this.prisma.team.update({
      where: { id },
      data,
      include: { department: { select: { id: true, name: true } } },
    });
  }

  // ==================== 사용자 관리 ====================

  // 전체 사용자 목록 (부서/팀 포함, 시스템 관리자 제외)
  async getUsers() {
    return this.prisma.user.findMany({
      where: { userId: { not: 'admin' } },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        position: true,
        role: true,
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: [
        { department: { name: 'asc' } },
        { team: { name: 'asc' } },
        { name: 'asc' },
      ],
    });
  }

  // 사용자 정보 수정 (부서/팀/직위/권한)
  async updateUser(
    id: number,
    data: {
      name?: string;
      position?: string;
      role?: Role;
      departmentId?: number | null;
      teamId?: number | null;
      email?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        position: true,
        role: true,
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });
  }

  // 신규 사용자 생성
  async createUser(data: {
    userId: string;
    name: string;
    position?: string;
    role?: Role;
    departmentId?: number;
    teamId?: number;
    email?: string;
  }) {
    const exists = await this.prisma.user.findUnique({
      where: { userId: data.userId },
    });
    if (exists) throw new BadRequestException('이미 존재하는 사용자 ID입니다.');

    // 기본 비밀번호: owms1234
    const hashedPassword = await bcrypt.hash('owms1234', 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: data.role || Role.MEMBER,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        position: true,
        role: true,
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });
  }

  // 비밀번호 초기화 (owms1234)
  async resetPassword(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const hashedPassword = await bcrypt.hash('owms1234', 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    return { message: '비밀번호가 초기화되었습니다.' };
  }

  // 팀을 독립된 부서로 승격
  async promoteTeamToDepartment(teamId: number) {
    return this.prisma.$transaction(async (tx) => {
      const team = await tx.team.findUnique({
        where: { id: teamId },
        include: { _count: { select: { users: true } } },
      });

      if (!team) throw new NotFoundException('팀을 찾을 수 없습니다.');

      // 1. 팀 이름으로 새 부서 생성 (중복 체크 포함)
      const existingDept = await tx.department.findUnique({
        where: { name: team.name },
      });
      if (existingDept)
        throw new BadRequestException(
          `이미 '${team.name}' 이름의 부서가 존재합니다. 팀명을 변경 후 시도하거나 기존 부서로 인원을 이동시키세요.`,
        );

      const newDept = await tx.department.create({
        data: { name: team.name },
      });

      // 2. 해당 팀에 속한 모든 사용자를 새 부서로 이동시키고 소속 팀은 null로 변경
      await tx.user.updateMany({
        where: { teamId: teamId },
        data: {
          departmentId: newDept.id,
          teamId: null,
        },
      });

      // 3. 기존 팀 삭제
      await tx.team.delete({
        where: { id: teamId },
      });

      return {
        id: newDept.id,
        name: newDept.name,
        message: `'${team.name}' 팀이 새로운 부서로 승격되었습니다. (${team._count.users}명의 소속이 변경되었습니다.)`,
      };
    });
  }

  // 부서를 다른 부서의 하위 팀으로 강등 (병합)
  async demoteDepartmentToTeam(sourceDeptId: number, targetDeptId: number) {
    return this.prisma.$transaction(async (tx) => {
      const sourceDept = await tx.department.findUnique({
        where: { id: sourceDeptId },
        include: { _count: { select: { users: true, teams: true } } },
      });
      const targetDept = await tx.department.findUnique({
        where: { id: targetDeptId },
      });

      if (!sourceDept || !targetDept)
        throw new NotFoundException('대상 부서를 찾을 수 없습니다.');
      if (sourceDeptId === targetDeptId)
        throw new BadRequestException('자기 자신으로 이동할 수 없습니다.');

      // 1. 타겟 부서 산하에 소스 부서 이름으로 '새 팀' 생성
      const newTeamName = sourceDept.name;
      // 이름 중복 방지 로직 (ex: 부산지사 -> 부산지사(1))
      let finalTeamName = newTeamName;
      let counter = 1;
      while (
        await tx.team.findFirst({
          where: { name: finalTeamName, departmentId: targetDeptId },
        })
      ) {
        finalTeamName = `${newTeamName} (${counter++})`;
      }

      const newTeam = await tx.team.create({
        data: {
          name: finalTeamName,
          departmentId: targetDeptId,
        },
      });

      // 2. 소스 부서 직속 인원들을 새 팀으로 이동
      await tx.user.updateMany({
        where: { departmentId: sourceDeptId, teamId: null },
        data: {
          departmentId: targetDeptId,
          teamId: newTeam.id,
        },
      });

      // 3. 소스 부서 산하의 기존 팀들을 타겟 부서로 이동 (Flat 구조화)
      // 소스 부서가 없어지므로, 그 아래 있던 팀들은 타겟 부서의 직속 팀이 됨.
      await tx.team.updateMany({
        where: { departmentId: sourceDeptId },
        data: { departmentId: targetDeptId },
      });

      // 4. 소스 부서 산하 팀 소속 인원들의 부서 ID 업데이트
      // (팀은 그대로지만 상위 부서가 바뀌었으므로 유저의 departmentId도 갱신 필요)
      // *주의*: 위에서 updateMany로 팀의 deptId를 바꿨지만, User 모델의 departmentId는 별도 필드이므로 갱신해야 함.
      // 하지만 Prisma 관계상 User -> Team -> Department 접근이 가능하더라도,
      // 현재 스키마가 User에 departmentId, teamId를 둘 다 가지고 있는 역정규화(또는 편의성) 구조라면 동기화 필수.
      // (User 모델: departmentId, teamId 필드 존재)

      // 소스 부서에 속해있던(팀 소속 포함) 모든 유저의 departmentId를 타겟으로 변경
      // (직속 인원은 이미 2번에서 처리됨, 여기서는 '팀 소속' 인원 처리)
      await tx.user.updateMany({
        where: { departmentId: sourceDeptId }, // 직속 인원은 이미 targetDeptId로 바뀌었으므로, 남은 건 팀 소속 인원들
        data: { departmentId: targetDeptId },
      });

      // 5. 소스 부서 삭제
      await tx.department.delete({
        where: { id: sourceDeptId },
      });

      return {
        message: `'${sourceDept.name}' 부서가 '${targetDept.name}' 부서 하위로 통합되었습니다.`,
      };
    });
  }
  // 부서 삭제 (인원 및 하위 팀 없을 경우만)
  async deleteDepartment(id: number) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, teams: true } },
      },
    });

    if (!dept) throw new NotFoundException('부서를 찾을 수 없습니다.');

    if (dept._count.users > 0) {
      throw new BadRequestException(
        `부서에 소속된 인원(${dept._count.users}명)이 있어 삭제할 수 없습니다.`,
      );
    }
    if (dept._count.teams > 0) {
      throw new BadRequestException(
        `부서에 소속된 팀(${dept._count.teams}개)이 있어 삭제할 수 없습니다.`,
      );
    }

    return this.prisma.department.delete({ where: { id } });
  }

  // 팀 삭제 (인원 없을 경우만)
  async deleteTeam(id: number) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!team) throw new NotFoundException('팀을 찾을 수 없습니다.');

    if (team._count.users > 0) {
      throw new BadRequestException(
        `팀에 소속된 인원(${team._count.users}명)이 있어 삭제할 수 없습니다.`,
      );
    }

    return this.prisma.team.delete({ where: { id } });
  }
}
