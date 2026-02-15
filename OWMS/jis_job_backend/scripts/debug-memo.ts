
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Listing tables in public schema...');
    try {
        const tables: any[] = await (prisma as any).$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log('Tables:', tables.map(t => t.table_name).join(', '));

        if (tables.some(t => t.table_name === 'SystemMemo')) {
            console.log('Table "SystemMemo" exists (Case Sensitive).');
        } else if (tables.some(t => t.table_name === 'systemmemo')) {
            console.log('Table "systemmemo" exists (Lowercase).');
        }

        const cols: any[] = await (prisma as any).$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'SystemMemo' OR table_name = 'systemmemo'
        `;
        console.log('Columns:', JSON.stringify(cols, null, 2));
    } catch (err) {
        console.error('Check failed:', err);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
