const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeDateStr(dateStr) {
  // Expect YYYY-MM-DD pattern
  return dateStr;
}

async function fetchProvider(countryCode, year) {
  const base = process.env.HOLIDAY_PROVIDER_BASE_URL || 'https://date.nager.at/api/v3';
  const url = `${base}/PublicHolidays/${year}/${countryCode}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Provider returned ${res.status}`);
  const data = await res.json();
  return data.map(item => ({ name: item.name || item.localName || '', date: item.date }));
}

async function main() {
  const yearArg = process.argv[2];
  const year = yearArg ? Number(yearArg) : new Date().getUTCFullYear();

  const company = await prisma.company.findFirst();
  if (!company) throw new Error('Company not found');
  const companyId = company.id;
  const countryCode = (company.countryCode || '').toUpperCase();
  console.log('Running sync for company', company.name, companyId, 'country', countryCode, 'year', year);

  const provider = await fetchProvider(countryCode, year);
  console.log('Provider holidays count:', provider.length);
  const providerByDate = new Map(provider.map(h => [h.date, h]));

  const existing = await prisma.holiday.findMany({ where: { companyId, year }, orderBy: { date: 'asc' } });
  console.log('Existing holidays for company/year:', existing.length);

  const existingByDate = new Map(existing.map(h => [h.date.toISOString().slice(0,10), h]));

  const toCreate = [];
  const toUpdate = [];
  const toDeleteIds = [];

  for (const [dateStr, ph] of providerByDate.entries()) {
    const ex = existingByDate.get(dateStr);
    if (ex) {
      if (ex.name !== ph.name || ex.countryCode !== countryCode) {
        toUpdate.push({ id: ex.id, name: ph.name });
      }
    } else {
      toCreate.push(ph);
    }
  }

  for (const ex of existing) {
    const key = ex.date.toISOString().slice(0,10);
    if (!providerByDate.has(key)) toDeleteIds.push(ex.id);
  }

  console.log('To create:', toCreate.length, 'to update:', toUpdate.length, 'to delete:', toDeleteIds.length);

  const ops = [];
  if (toDeleteIds.length) ops.push(prisma.holiday.deleteMany({ where: { id: { in: toDeleteIds } } }));
  for (const u of toUpdate) ops.push(prisma.holiday.update({ where: { id: u.id }, data: { name: u.name, year, companyId, countryCode } }));
  for (const c of toCreate) {
    const date = new Date(`${c.date}T12:00:00Z`);
    ops.push(prisma.holiday.create({ data: { name: c.name, date, year, countryCode, companyId } }));
  }

  if (ops.length) await prisma.$transaction(ops);

  await prisma.company.update({ where: { id: companyId }, data: { holidaySyncYear: year, holidaySyncAt: new Date() } });

  console.log('Sync complete');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
