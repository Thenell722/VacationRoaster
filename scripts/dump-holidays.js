const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const company = await prisma.company.findFirst();
    console.log('COMPANY:', company);

    const holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
    console.log('HOLIDAYS_COUNT:', holidays.length);
    for (const h of holidays) {
      console.log(JSON.stringify(h));
    }

    const nullCompany = await prisma.holiday.findMany({ where: { companyId: null }, orderBy: { date: 'asc' } });
    console.log('HOLIDAYS_WITH_NULL_COMPANY:', nullCompany.length);
    for (const h of nullCompany) console.log('NULL_COMPANY:', JSON.stringify(h));

    const duplicates = await prisma.$queryRawUnsafe("SELECT date, countryCode, COUNT(*) as cnt FROM holidays GROUP BY date, countryCode HAVING cnt > 1");
    console.log('DUPLICATES:', JSON.stringify(duplicates));
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
