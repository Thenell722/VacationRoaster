'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { companyUpdateSchema } from '@/lib/validations';
import { writeAuditLog } from '@/lib/data';
import type { ActionResult } from '@/actions/vacation';

export async function updateCompany(input: z.infer<typeof companyUpdateSchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = companyUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const normalizedCountryCode = parsed.data.countryCode.toUpperCase();
  const existingCompany = await prisma.company.findFirst();

  if (existingCompany) {
    await prisma.company.update({
      where: { id: existingCompany.id },
      data: {
        name: parsed.data.name,
        countryCode: normalizedCountryCode,
      },
    });
  } else {
    await prisma.company.create({
      data: {
        name: parsed.data.name,
        countryCode: normalizedCountryCode,
      },
    });
  }

  await writeAuditLog(admin.id, 'COMPANY_UPDATED', `${parsed.data.name} (${normalizedCountryCode})`);
  revalidatePath('/profile');
  revalidatePath('/dashboard');
  revalidatePath('/admin/holidays');

  return { success: true };
}
