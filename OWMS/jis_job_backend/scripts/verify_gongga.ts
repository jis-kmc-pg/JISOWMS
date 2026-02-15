import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma.service';
import { WorkStatusService } from './src/work-status/work-status.service';
import { ExcelService } from './src/excel/excel.service';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';

async function verifyGongga() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: false }); // Nest 로거 비활성화 설정 추가
    const prisma = app.get(PrismaService);
    const workStatusService = app.get(WorkStatusService);
    const excelService = app.get(ExcelService);

    try {
        console.log('1. Setting up test user and data...');
        // Create or get test user
        const testEmail = 'gongga_test@example.com';
        let user = await prisma.user.findUnique({ where: { email: testEmail } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: testEmail,
                    password: 'password',
                    name: '공가테스터',
                    role: 'MEMBER' as any, // Role enum 'MEMBER'
                    userId: '99999', // Unique ID (String)
                },
            });
        }

        // WorkStatusService expects requestUser object with { id: number, role: string }
        const requestUser = { id: user.id, role: user.role };

        // Set date to current week's Wednesday (to be safe inside week)
        const today = new Date();
        const cleanDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // Ensure we are testing a specific date that is definitely in the report window
        // For simplicity, let's just use today and ensure we request report for this week.

        // Clear existing data for today
        await prisma.job.deleteMany({
            where: { userId: user.id, jobDate: { gte: cleanDate, lt: new Date(cleanDate.getTime() + 86400000) } }
        });
        await prisma.dailyStatus.deleteMany({
            where: { userId: user.id, date: { gte: cleanDate, lt: new Date(cleanDate.getTime() + 86400000) } }
        });

        // Create '공가' status
        await prisma.dailyStatus.create({
            data: {
                userId: user.id,
                date: cleanDate,
                workType: '공가',
            }
        });
        console.log(`   Created DailyStatus '공가' for ${cleanDate.toISOString().split('T')[0]}`);

        console.log('2. Verifying getWeeklyStatus logic...');
        const weeklyStatus = await workStatusService.getWeeklyStatus(
            requestUser,
            cleanDate.toISOString().split('T')[0],
            undefined // teamId as undefined
        );

        // Find our user in the list
        // Note: getWeeklyStatus might return users from all teams or filtered? 
        // It filters by teamId if provided, or returns all?
        // Let's check logic: if teamId null, it finds users with NO team? Or all users?
        // WorkStatusService.getWeeklyStatus logic: 
        // const where = teamId ? { teamId } : {}; 
        // const users = await this.prisma.user.findMany({ where, ... });
        // So it fetches ALL users if teamId is null.

        // weeklyStatus is Array of { date, dayOfWeek, statuses: Array<UserStatus> }
        const targetDateStr = cleanDate.toISOString().split('T')[0];
        const dayData = weeklyStatus.find((d: any) => d.date === targetDateStr);

        if (!dayData) {
            console.error(`ERROR: Date ${targetDateStr} not found in weekly status response.`);
        } else {
            // property name is 'statuses' based on service? No, 'getWeeklyStatus' returns { users: ... }?
            // Check service logic: 'weeklyStatus.push({ ..., statuses: userStatuses })'
            // My previous analysis said 'statuses: userStatuses'.
            // Wait, 'userStatuses' is the variable name in service.
            // Line 86 in service (step 579): 'weeklyStatus.push({ date: dateString, dayOfWeek: days[i], statuses: userStatuses });'
            // So the property IS 'statuses'.
            // Why did linter complain "Property 'statuses' does not exist"?
            // Maybe I was wrong about what 'getWeeklyStatus' returns?
            // It is 'any' if not typed?
            // 'const weeklyStatus = ...'.
            // Nest service method returns 'implicit ANY' or 'inferred type'.
            // If inferred, it should have 'statuses'.
            // But verify script linter said: "Property 'statuses' does not exist on type ...".
            // The type shown in error message was: '{ date: string; dayOfWeek: string; users: { id: number; ... }[]; }'.
            // WAIT! The error message said 'users'!
            // "Property 'statuses' does not exist on type '{ ...; users: ...[]; }'".
            // This means the return type HAS 'users' property, not 'statuses'.
            // Let's re-read WorkStatusService in step 579!
            // Line 86 in replacement content was:
            // '          status: (hasJob || isExempt) ? 'DONE' : 'MISSING','
            // This is inside the map.
            // But the push to weeklyStatus?
            // I didn't verify the lines AROUND line 86-90 in step 579.
            // I only replaced the inner mapping logic.
            // I MUST check the 'weeklyStatus.push' line in 'WorkStatusService'.
            // I'll assume usage of 'users' per linter message.
            const userStatus = (dayData as any).statuses ? (dayData as any).statuses.find((u: any) => u.id === user.id) : (dayData as any).users.find((u: any) => u.id === user.id);
            if (!userStatus) {
                console.error('ERROR: Test user not found in day status.');
            } else {
                console.log(`   User Status found for ${targetDateStr}: ${userStatus.status}`);

                if (userStatus.status === 'DONE') {
                    console.log('   SUCCESS: Status is DONE (as expected for 공가).');
                } else {
                    console.error(`   FAILURE: Status is ${userStatus.status}, expected DONE.`);
                }
            }
        }

        console.log('3. Verifying Excel export...');
        const excelBuffer = await excelService.generateWeeklyReport(user.id, cleanDate.toISOString().split('T')[0]);

        // Parse Excel and check for '공가' text
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(excelBuffer as any);
        const worksheet = workbook.getWorksheet(1); // '양식 (2)'? No, it's index based or name.
        // ExcelService uses `workbook.worksheets[1]`, so here we should check 2nd sheet? 
        // Or `generateWeeklyReport` returns buffer of `workbook`.
        // When loading buffer, it loads all sheets.
        // Let's check the sheet that has data. Likely the active one or first one?
        // ExcelService reads template and modifies it. Template likely has sheets.
        // We'll iterate rows to find '[공가]'.

        let foundGongga = false;
        worksheet?.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
                if (cell.value && cell.value.toString().includes('[공가]')) {
                    foundGongga = true;
                    console.log(`   Found '[공가]' at Row ${rowNumber}, Col ${colNumber}`);
                }
            });
        });

        if (foundGongga) {
            console.log('   SUCCESS: Excel contains [공가].');
        } else {
            console.error('   FAILURE: Excel does NOT contain [공가].');
            // Save for manual inspection
            fs.writeFileSync('verify_gongga_fail.xlsx', excelBuffer);
            console.log('   Saved verify_gongga_fail.xlsx for inspection.');
            // Also check 2nd sheet just in case
            const ws2 = workbook.worksheets[1];
            if (ws2) {
                ws2.eachRow((row, rowNumber) => {
                    row.eachCell((cell, colNumber) => {
                        if (cell.value && cell.value.toString().includes('[공가]')) {
                            console.log(`   Found '[공가]' at Sheet 2, Row ${rowNumber}, Col ${colNumber}`);
                            foundGongga = true;
                        }
                    });
                });
            }
        }

    } catch (error) {
        console.error('Test failed with error:', error);
    } finally {
        await app.close();
    }
}

verifyGongga();
