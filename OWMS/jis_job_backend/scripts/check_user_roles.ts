import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking User Roles ---');
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            role: true,
            position: true,
            departmentId: true,
            teamId: true
        }
    });

    console.table(users);

    const teamLeads = users.filter(u => (u.role as any) === 'TEAM_LEAD' || (u.role as any) === 'TEAM_LEADER');
    console.log(`Found ${teamLeads.length} Team Leads.`);

    if (teamLeads.length > 0) {
        console.log('Team Lead Details:', teamLeads);
    } else {
        console.log('No users found with role TEAM_LEAD or TEAM_LEADER.');
    }

    // --- Print all users with their roles for debugging ---
    console.log('--- All Users ---');
    users.forEach(u => console.log(`${u.id}: ${u.name} - ${u.role} (Team: ${u.teamId})`));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
