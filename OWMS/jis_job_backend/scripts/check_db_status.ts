import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const jobCount = await prisma.job.count();

    console.log('User Count:', userCount);
    console.log('Project Count:', projectCount);
    console.log('Job Count:', jobCount);

    const jobs = await prisma.job.findMany({ select: { title: true, jobDate: true, userId: true } });
    console.log('Jobs:', jobs);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
