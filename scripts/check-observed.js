const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log('No company');
    return;
  }
  const year = company.holidaySyncYear || new Date().getUTCFullYear();
  console.log('Company', company.id, company.countryCode, 'year', year);
  const holidays = await prisma.holiday.findMany({ where: { companyId: company.id, year }, orderBy: { date: 'asc' } });
  const map = new Map(holidays.map(h => [h.date.toISOString().slice(0,10), h]));

  let foundSunday = false;
  for (const h of holidays) {
    const d = new Date(h.date);
    if (d.getUTCDay() === 0) {
      foundSunday = true;
      const obs = new Date(d);
      obs.setUTCDate(obs.getUTCDate() + 1);
      const obsStr = obs.toISOString().slice(0,10);
      console.log(`${h.name} on ${h.date.toISOString().slice(0,10)} is Sunday; observed ${obsStr} exists:`, map.has(obsStr));
    }
  }
  if (!foundSunday) console.log('No holidays falling on Sunday for this company/year.');

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });