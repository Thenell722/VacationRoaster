const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log('No company found');
    return;
  }
  if ((company.countryCode || '').toUpperCase() !== 'LC') {
    console.log('Company country is not LC; nothing to do.');
    return;
  }

  const year = company.holidaySyncYear || new Date().getUTCFullYear();
  console.log('Applying observed LC rules for company', company.id, 'year', year);

  const holidays = await prisma.holiday.findMany({ where: { companyId: company.id, year }, orderBy: { date: 'asc' } });
  const map = new Map(holidays.map(h => [h.date.toISOString().slice(0,10), h]));

  const toCreate = [];
  for (const h of holidays) {
    const d = new Date(h.date);
    if (d.getUTCDay() === 0) {
      const obs = new Date(d);
      obs.setUTCDate(obs.getUTCDate() + 1);
      const obsStr = obs.toISOString().slice(0,10);
      if (!map.has(obsStr)) {
        toCreate.push({ name: `${h.name} (Observed)`, date: obsStr });
        map.set(obsStr, { }); // reserve
      }
    }
  }

  console.log('Observed to create:', toCreate.length);
  for (const c of toCreate) {
    const date = new Date(`${c.date}T12:00:00Z`);
    const created = await prisma.holiday.create({ data: { name: c.name, date, year, countryCode: 'LC', companyId: company.id } });
    console.log('Created observed:', created.id, created.name, created.date.toISOString());
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });