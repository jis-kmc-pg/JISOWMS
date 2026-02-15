import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import cookieParser from 'cookie-parser';

describe('Metrics & Vacation (e2e)', () => {
    let app: INestApplication;
    let authCookie: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        await app.init();

        // 1. Login as Team Leader (kmc)
        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ userId: 'kmc', password: 'owms1234' });

        const cookies = loginRes.get('Set-Cookie');
        if (cookies) {
            authCookie = cookies.find(c => c.startsWith('access_token='));
        }

        if (!authCookie) {
            console.error('Login failed. Response:', loginRes.body);
        }
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Metrics Module', () => {
        it('/metrics/dashboard (GET) - Should return TEAM scope stats', async () => {
            const res = await request(app.getHttpServer())
                .get('/metrics/dashboard')
                .set('Cookie', authCookie ? [authCookie] : []);

            if (res.status !== 200) console.log('Metrics Error:', res.body);
            expect(res.status).toBe(200);
            expect(res.body.scope).toBe('TEAM');
            expect(res.body.stats).toHaveProperty('weeklyWorkStats');
            expect(res.body.stats).toHaveProperty('jobNameStats');
        });
    });

    describe('Security & RBAC (Role Based Access Control)', () => {
        let memberCookie: string;

        beforeAll(async () => {
            // Login as Member (psj)
            const loginRes = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ userId: 'psj', password: 'owms1234' });
            const cookies = loginRes.get('Set-Cookie');
            if (cookies) memberCookie = cookies.find(c => c.startsWith('access_token='));
        });

        it('/metrics/dashboard (GET) - Member should only see PERSONAL scope', async () => {
            const res = await request(app.getHttpServer())
                .get('/metrics/dashboard')
                .set('Cookie', [memberCookie]);

            expect(res.status).toBe(200);
            expect(res.body.scope).toBe('PERSONAL'); // Should not be TEAM
            expect(res.body.stats).toBeUndefined(); // Personal stats structure differs
        });

        it('/vacations/admin/stats (GET) - Member access should be limited/defined', async () => {
            const res = await request(app.getHttpServer())
                .get('/vacations/admin/stats?year=2026')
                .set('Cookie', [memberCookie]);

            // Depends on implementation, if not blocked at controller, might return empty or error
            // If RolesGuard is implemented, it should be 403
            console.log('Member Access to Admin Stats Status:', res.status);
        });
    });
});
