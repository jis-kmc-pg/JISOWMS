
import { PrismaClient } from '@prisma/client';

const BASE_URL = 'http://localhost:4000';
let token = '';

function extractTokenFromCookie(cookieHeader: string | null): string {
    if (!cookieHeader) return '';
    // Cookie header format: "access_token=eyJ...; Path=/; HttpOnly..., refresh_token=..."
    // Note: Node fetch might return multiple set-cookie headers combined or iterable.
    // If combined with comma, it might be tricky as dates use commas.
    // But we simpler regex for access_token=...;
    const match = cookieHeader.match(/access_token=([^;]+)/);
    return match ? match[1] : '';
}

async function login() {
    try {
        console.log('Attempting login as admin...');
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'admin', password: '1234' })
        });

        let loginResp = response;
        if (!response.ok) {
            console.log('Admin login failed, trying kimgh...');
            const response2 = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'kimgh', password: 'owms1234' })
            });
            if (!response2.ok) {
                console.error('All logins failed');
                throw new Error('Login failed');
            }
            loginResp = response2;
            console.log('Login successful (kimgh)');
        } else {
            console.log('Login successful (admin)');
        }

        // Try to get token from body first (just in case)
        const data: any = await loginResp.json(); // Consumes body, but cookies are in headers

        if (data.accessToken) {
            token = data.accessToken;
        } else {
            // Extract from Set-Cookie header
            const cookie = loginResp.headers.get('set-cookie');
            console.log('Set-Cookie Header:', cookie);

            const extracted = extractTokenFromCookie(cookie);
            if (extracted) {
                token = extracted;
            } else {
                console.error('Failed to extract token from cookie');
            }
        }

        if (!token) {
            throw new Error('Could not retrieve access token from Body or Cookie');
        }

        console.log('Token determined length:', token.length);

    } catch (e) {
        console.error('Login Error:', e);
        process.exit(1);
    }
}

async function request(method: string, path: string, body: any = undefined) {
    // We can send as Bearer token because JwtStrategy supports it
    const headers: any = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    console.log(`Requesting ${method} ${path}`);
    const response = await fetch(`${BASE_URL}${path}`, {
        method, headers, body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Request failed: ${method} ${path} -> ${response.status} ${txt}`);
    }
    return response.json();
}

async function main() {
    const prisma = new PrismaClient();
    await prisma.$connect();

    try {
        await login();

        // 0. Verify Auth work with GET
        console.log('Verifying Auth with GET /admin/users (limit 1)...');
        await request('GET', '/admin/users');
        console.log('✅ GET /admin/users successful');

        // 1. Create Departments
        console.log('Creating Departments...');
        const deptA: any = await request('POST', '/admin/departments', { name: 'API_OrderTest_A' });
        const deptB: any = await request('POST', '/admin/departments', { name: 'API_OrderTest_B' });
        console.log(`Created: ${deptA.name} (${deptA.id}), ${deptB.name} (${deptB.id})`);

        // 2. Initial Check
        let depts: any = await request('GET', '/admin/departments');
        let idxA = depts.findIndex((d: any) => d.id === deptA.id);
        let idxB = depts.findIndex((d: any) => d.id === deptB.id);
        console.log(`Initial Order: A(${idxA}), B(${idxB})`);

        // 3. Reorder: Move A down (swap with B if adjacent)
        console.log('Moving A down...');
        await request('POST', `/admin/departments/${deptA.id}/reorder`, { direction: 'down' });

        depts = await request('GET', '/admin/departments');
        idxA = depts.findIndex((d: any) => d.id === deptA.id);
        idxB = depts.findIndex((d: any) => d.id === deptB.id);
        console.log(`Order after swap: A(${idxA}), B(${idxB})`);

        if (idxA > idxB) {
            console.log('✅ Department swap successful');
        } else {
            console.error('❌ Department swap failed');
        }

        // 4. Create Teams in A
        console.log('Creating Teams in A...');
        const team1: any = await request('POST', '/admin/teams', { name: 'API_Team1', departmentId: deptA.id });
        const team2: any = await request('POST', '/admin/teams', { name: 'API_Team2', departmentId: deptA.id });
        console.log(`Created Teams: ${team1.name}, ${team2.name}`);

        // 5. Reorder Team: Move Team1 down
        console.log('Moving Team1 down...');
        await request('POST', `/admin/teams/${team1.id}/reorder`, { direction: 'down' });

        // Fetch teams inside department structure usually, or just get all teams
        // The endpoint /admin/departments returns teams included
        depts = await request('GET', '/admin/departments');
        const deptA_updated = depts.find((d: any) => d.id === deptA.id);
        const teams = deptA_updated.teams; // ordered by orderIndex

        const t1Idx = teams.findIndex((t: any) => t.id === team1.id);
        const t2Idx = teams.findIndex((t: any) => t.id === team2.id);
        console.log(`Team Order after swap: T1(${t1Idx}), T2(${t2Idx})`);

        if (t1Idx > t2Idx) {
            console.log('✅ Team swap successful');
        } else {
            console.error('❌ Team swap failed');
        }

        // Cleanup
        console.log('Cleaning up...');
        await request('DELETE', `/admin/teams/${team1.id}`);
        await request('DELETE', `/admin/teams/${team2.id}`);
        await request('DELETE', `/admin/departments/${deptA.id}`);
        await request('DELETE', `/admin/departments/${deptB.id}`);
        console.log('Cleanup done.');

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
