/**
 * Server Actions for user profile management.
 *
 * This file contains server-side operations that allow authenticated users
 * to manage their own account information, including updating their profile
 * details and changing their password.
 *
 * Each action:
 * - Ensures the user is authenticated.
 * - Validates incoming data using Zod schemas.
 * - Performs the required database operation using Prisma.
 * - Hashes passwords before storing them (when applicable).
 * - Records security-related actions in the audit log.
 * - Revalidates affected pages so the UI displays the latest data.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { profileUpdateSchema, passwordChangeSchema } from '@/lib/validations';
import { writeAuditLog } from '@/lib/data';
import type { ActionResult } from '@/actions/vacation';

export async function updateProfile(input: z.infer<typeof profileUpdateSchema>): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: 'You must be signed in.' };

  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      profileImage: parsed.data.profileImage ?? null,
    },
  });

  revalidatePath('/profile');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function changePassword(input: z.infer<typeof passwordChangeSchema>): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: 'You must be signed in.' };

  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { error: 'User not found.' };

  const valid = await bcrypt.compare(parsed.data.currentPassword, dbUser.password);
  if (!valid) return { error: 'Current password is incorrect.' };

  const hashed = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  await writeAuditLog(user.id, 'PASSWORD_CHANGED');
  revalidatePath('/profile');
  return { success: true };
}
