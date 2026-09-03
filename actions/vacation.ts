/**
 * Server Actions for vacation request management.
 *
 * This file contains the core business logic for creating, cancelling,
 * approving, and rejecting vacation requests.
 *
 * Each action:
 * - Ensures the user is authenticated (and an administrator where required).
 * - Validates incoming data using Zod schemas.
 * - Enforces business rules such as leave balances, overlapping requests,
 *   employee status, and approval permissions.
 * - Performs the required database operations using Prisma.
 * - Records important actions in the audit log.
 * - Revalidates affected pages so users see the latest request information.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { vacationRequestSchema, reviewActionSchema } from '@/lib/validations';
import { calculateWorkingDays, dateRangesOverlap } from '@/lib/working-days';
import { getHolidays, getEmployeeRequests, writeAuditLog } from '@/lib/data';

export interface ActionResult {
  success?: boolean;
  error?: string;
}

export async function createVacationRequest(input: z.infer<typeof vacationRequestSchema>): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: 'You must be signed in.' };
  if (!user.active) return { error: 'Inactive employees cannot submit requests.' };

  const parsed = vacationRequestSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const { startDate, endDate, reason } = parsed.data;
  const holidays = await getHolidays();
  const workingDays = calculateWorkingDays(startDate, endDate, holidays);
  if (workingDays <= 0) return { error: 'The selected range contains no working days.' };

  const requests = await getEmployeeRequests(user.id);
  const active = requests.filter((r) => r.status === 'APPROVED' || r.status === 'PENDING');
  const overlap = active.find((r) => dateRangesOverlap(startDate, endDate, r.startDate, r.endDate));
  if (overlap) return { error: 'This request overlaps with an existing approved or pending request.' };

  const approvedDays = requests.filter((r) => r.status === 'APPROVED').reduce((s, r) => s + r.workingDays, 0);
  const remaining = user.annualAllowance + user.carryOverDays - approvedDays;
  if (workingDays > remaining) return { error: `This request exceeds your remaining balance (${remaining} days left).` };

  await prisma.vacationRequest.create({
    data: {
      employeeId: user.id,
      startDate: new Date(`${startDate}T12:00:00Z`),
      endDate: new Date(`${endDate}T12:00:00Z`),
      workingDays,
      reason: reason ?? null,
      status: 'PENDING',
    },
  });

  await writeAuditLog(user.id, 'REQUEST_CREATED', `${startDate} → ${endDate} (${workingDays} working days)`);
  revalidatePath('/dashboard');
  revalidatePath('/history');
  return { success: true };
}

export async function cancelVacationRequest(requestId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { error: 'You must be signed in.' };

  const req = await prisma.vacationRequest.findUnique({ where: { id: requestId } });
  if (!req) return { error: 'Request not found.' };
  if (req.employeeId !== user.id && user.role !== 'ADMIN') return { error: 'You can only cancel your own requests.' };
  if (req.status !== 'PENDING') return { error: 'Only pending requests can be cancelled.' };

  await prisma.vacationRequest.update({ where: { id: requestId }, data: { status: 'CANCELLED' } });
  await writeAuditLog(user.id, 'REQUEST_CANCELLED', `Request ${requestId}`);
  revalidatePath('/dashboard');
  revalidatePath('/history');
  revalidatePath('/admin/requests');
  return { success: true };
}

export async function reviewVacationRequest(input: z.infer<typeof reviewActionSchema>): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') return { error: 'Forbidden.' };

  const parsed = reviewActionSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input.' };

  const { requestId, action, comment } = parsed.data;
  const req = await prisma.vacationRequest.findUnique({ where: { id: requestId } });
  if (!req) return { error: 'Request not found.' };
  if (req.status !== 'PENDING') return { error: 'This request is no longer pending.' };
  if (req.employeeId === user.id) return { error: 'You cannot approve your own request.' };

  const employee = await prisma.user.findUnique({ where: { id: req.employeeId } });
  if (!employee?.active) return { error: 'Cannot review requests for inactive employees.' };

  if (action === 'APPROVE') {
    const all = await getEmployeeRequests(employee.id);
    const approvedDays = all.filter((r) => r.status === 'APPROVED').reduce((s, r) => s + r.workingDays, 0);
    const remaining = employee.annualAllowance + employee.carryOverDays - approvedDays;
    if (req.workingDays > remaining) return { error: 'Employee does not have enough remaining balance.' };
  }

  const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  await prisma.vacationRequest.update({
    where: { id: requestId },
    data: { status: newStatus, managerComment: comment ?? null, approvedAt: new Date(), approvedById: user.id },
  });

  await writeAuditLog(user.id, action === 'APPROVE' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED', `Request ${requestId}${comment ? ` — ${comment}` : ''}`);
  revalidatePath('/admin/requests');
  revalidatePath('/admin/dashboard');
  revalidatePath('/dashboard');
  revalidatePath('/history');
  return { success: true };
}
