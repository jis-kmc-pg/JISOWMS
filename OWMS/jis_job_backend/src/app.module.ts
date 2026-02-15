import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WorkStatusModule } from './work-status/work-status.module';
import { VacationModule } from './vacation/vacation.module';
import { ExcelModule } from './excel/excel.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { MetricsModule } from './metrics/metrics.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { BoardModule } from './board/board.module';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    ReportsModule,
    DashboardModule,
    WorkStatusModule,
    VacationModule,
    ExcelModule,
    UserModule,
    AdminModule,
    MetricsModule,
    VehicleModule,
    DispatchModule,
    BoardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
