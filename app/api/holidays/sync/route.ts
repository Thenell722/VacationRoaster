import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { getCompany } from '@/lib/data';
import { syncPublicHolidays } from '@/lib/holidays';

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const year = typeof body.year === 'number' ? body.year : new Date().getUTCFullYear();
    const company = await getCompany();
    const result = await syncPublicHolidays(company.id, company.countryCode, year);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Holiday synchronization failed:', error);
    const message = error instanceof Error ? error.message : 'Holiday synchronization failed.';

    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
