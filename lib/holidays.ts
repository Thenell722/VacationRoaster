import prisma from '@/lib/db';

const HOLIDAY_PROVIDER_BASE_URL = process.env.HOLIDAY_PROVIDER_BASE_URL ?? 'https://date.nager.at/api/v3';

export interface ProviderHoliday {
  name: string;
  date: string;
}

function normalizeCountryCode(countryCode: string) {
  const value = String(countryCode ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(value)) {
    throw new Error('Country code must be a valid 2-letter ISO code.');
  }
  return value;
}

function normalizeYear(year: number) {
  if (!Number.isInteger(year) || year < 1900 || year > 9999) {
    throw new Error('Year must be a valid four-digit number.');
  }
  return year;
}

export async function fetchPublicHolidays(countryCode: string, year: number): Promise<ProviderHoliday[]> {
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const normalizedYear = normalizeYear(year);

  const response = await fetch(`${HOLIDAY_PROVIDER_BASE_URL}/PublicHolidays/${normalizedYear}/${normalizedCountryCode}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Holiday provider returned ${response.status}.`);
  }

  const data = (await response.json()) as Array<Record<string, unknown>>;
  return data.map((item) => {
    const name = String(item.name ?? item.localName ?? '').trim();
    const date = String(item.date ?? '').trim();

    if (!name || !date) {
      throw new Error('Holiday provider returned invalid data.');
    }

    return { name, date };
  });
}

export async function syncPublicHolidays(companyId: string, countryCode: string, year: number) {
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const normalizedYear = normalizeYear(year);

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new Error('Company settings not found.');
  }

  const holidays = await fetchPublicHolidays(normalizedCountryCode, normalizedYear);
  // If provider returns no holidays, allow Saint Lucia rule to still add Jan 1/2; otherwise throw
  if (holidays.length === 0 && normalizedCountryCode !== 'LC') {
    throw new Error(`No public holidays found for ${normalizedCountryCode} in ${normalizedYear}.`);
  }

  // Map provider holidays by ISO date (YYYY-MM-DD)
  const providerByDate = new Map<string, ProviderHoliday>();
  for (const h of holidays) providerByDate.set(h.date, h);

  // Saint Lucia (LC) special-case: ensure New Year's Day (Jan 1) and New Year's Holiday (Jan 2) are present
  if (normalizedCountryCode === 'LC') {
    const jan1 = `${normalizedYear}-01-01`;
    const jan2 = `${normalizedYear}-01-02`;
    if (!providerByDate.has(jan1)) providerByDate.set(jan1, { name: `New Year's Day`, date: jan1 });
    if (!providerByDate.has(jan2)) providerByDate.set(jan2, { name: `New Year's Holiday`, date: jan2 });

    // Observed-day rule for Saint Lucia: if a holiday falls on Sunday, the following Monday (same year) is the observed holiday.
    for (const [dateStr, ph] of Array.from(providerByDate.entries())) {
      const d = new Date(`${dateStr}T12:00:00Z`);
      // getUTCDay: 0 = Sunday
      if (d.getUTCDay() === 0) {
        const obs = new Date(d);
        obs.setUTCDate(obs.getUTCDate() + 1);
        const obsYear = obs.getUTCFullYear();
        const obsStr = obs.toISOString().slice(0, 10);
        // Only inject observed date if it falls within the synced year and doesn't already exist
        if (obsYear === normalizedYear && !providerByDate.has(obsStr)) {
          providerByDate.set(obsStr, { name: `${ph.name} (Observed)`, date: obsStr });
        }
      }
    }
  }

  // Load existing holidays for this company and year (replace whatever country was previously imported)
  const existingHolidays = await prisma.holiday.findMany({ where: { companyId, year: normalizedYear } });
  // Map date -> array of existing holidays (there may be multiple with different countryCodes)
  const existingByDate = new Map<string, typeof existingHolidays>();
  for (const holiday of existingHolidays) {
    const key = holiday.date.toISOString().slice(0, 10);
    const arr = existingByDate.get(key) ?? [];
    arr.push(holiday);
    existingByDate.set(key, arr);
  }

  const toCreate: ProviderHoliday[] = [];
  const toUpdate: { existingId: string; date: Date; name: string; countryCode?: string }[] = [];
  const toDeleteIds: string[] = [];

  // Determine creates, updates and intra-date deletions
  for (const [dateStr, providerHoliday] of providerByDate.entries()) {
    const existingArr = existingByDate.get(dateStr) ?? [];
    const date = new Date(`${dateStr}T12:00:00Z`);

    // Prefer an existing record with matching countryCode
    let keeper = existingArr.find((e) => e.countryCode === normalizedCountryCode);
    if (!keeper && existingArr.length > 0) {
      // No matching countryCode — promote the first existing row to keeper (it will be updated)
      keeper = existingArr[0];
    }

    if (keeper) {
      // Update keeper if needed
      if (keeper.name !== providerHoliday.name || keeper.countryCode !== normalizedCountryCode || keeper.companyId !== companyId) {
        toUpdate.push({ existingId: keeper.id, date, name: providerHoliday.name, countryCode: normalizedCountryCode });
      }

      // Mark any other existing rows on the same date for deletion (avoid duplicates)
      for (const other of existingArr) {
        if (other.id !== keeper.id) toDeleteIds.push(other.id);
      }
    } else {
      // No existing rows for this date — create a new one
      toCreate.push(providerHoliday);
    }
  }

  // Determine deletes for any existing dates not present in provider list (remove stale rows)
  for (const [dateStr, existingArr] of existingByDate.entries()) {
    if (!providerByDate.has(dateStr)) {
      for (const ex of existingArr) toDeleteIds.push(ex.id);
    }
  }

  const created = toCreate.length;
  const updated = toUpdate.length;
  const deleted = toDeleteIds.length;

  const ops: any[] = [];

  // Delete obsolete holidays first to avoid unique constraint conflicts
  if (toDeleteIds.length > 0) {
    ops.push(prisma.holiday.deleteMany({ where: { id: { in: toDeleteIds } } }));
  }

  // Updates
  for (const u of toUpdate) {
    ops.push(
      prisma.holiday.update({ where: { id: u.existingId }, data: { name: u.name, year: normalizedYear, companyId } }),
    );
  }

  // Creates
  for (const c of toCreate) {
    const date = new Date(`${c.date}T12:00:00Z`);
    ops.push(
      prisma.holiday.create({ data: { name: c.name, date, year: normalizedYear, countryCode: normalizedCountryCode, companyId } }),
    );
  }

  // Run all operations in a transaction
  if (ops.length > 0) {
    await prisma.$transaction(ops);
  }

  await prisma.company.update({ where: { id: companyId }, data: { holidaySyncYear: normalizedYear, holidaySyncAt: new Date() } });

  return { created, updated, deleted, total: providerByDate.size, holidaySyncYear: normalizedYear };
}
