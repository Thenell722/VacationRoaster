/**
 * Server Actions for administrative management.
 *
 * This file contains all server-side operations that can only be performed
 * by administrators, including managing employees, departments, holidays,
 * and employee passwords.
 *
 * Each action:
 * - Ensures the current user is an authenticated administrator.
 * - Validates incoming data using Zod schemas.
 * - Performs the required database operation using Prisma.
 * - Records the action in the audit log.
 * - Revalidates affected pages so the UI displays fresh data.
 */




'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { employeeCreateSchema, employeeEditSchema, holidaySchema, departmentSchema } from '@/lib/validations';
import { getCompany, writeAuditLog } from '@/lib/data';
import type { ActionResult } from '@/actions/vacation';
import { formatDateOnly } from '@/lib/date';

export async function createEmployee(input: z.infer<typeof employeeCreateSchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = employeeCreateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return { error: 'A user with that email already exists.' };

  const hashed = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      firstName: parsed.data.firstName, lastName: parsed.data.lastName,
      email: parsed.data.email.toLowerCase(), password: hashed,
      role: parsed.data.role, departmentId: parsed.data.departmentId ?? null,
      annualAllowance: parsed.data.annualAllowance, carryOverDays: parsed.data.carryOverDays,
      active: true,
    },
  });

  await writeAuditLog(admin.id, 'EMPLOYEE_CREATED', `${parsed.data.firstName} ${parsed.data.lastName} (${parsed.data.email})`);
  revalidatePath('/admin/employees');
  revalidatePath('/admin/dashboard');
  return { success: true };
}

export async function updateEmployee(userId: string, input: z.infer<typeof employeeEditSchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = employeeEditSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: parsed.data.firstName, lastName: parsed.data.lastName,
      email: parsed.data.email.toLowerCase(), departmentId: parsed.data.departmentId ?? null,
      annualAllowance: parsed.data.annualAllowance, carryOverDays: parsed.data.carryOverDays,
      active: parsed.data.active, role: parsed.data.role,
    },
  });

  await writeAuditLog(admin.id, 'EMPLOYEE_UPDATED', `Employee ${userId}`);
  revalidatePath('/admin/employees');
  revalidatePath('/admin/dashboard');
  return { success: true };
}

export async function deleteEmployee(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (admin.id === userId) return { error: 'You cannot delete your own account.' };

  const employee = await prisma.user.findUnique({ where: { id: userId } });
  if (!employee) return { error: 'Employee not found.' };

  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (employee.role === 'ADMIN' && adminCount <= 1) return { error: 'At least one administrator must remain.' };

  await prisma.$transaction(async (tx) => {
    await tx.vacationRequest.updateMany({ where: { approvedById: userId }, data: { approvedById: null } });
    await tx.user.delete({ where: { id: userId } });
  });

  await writeAuditLog(admin.id, 'EMPLOYEE_DELETED', `${employee.firstName} ${employee.lastName}`);
  revalidatePath('/admin/employees');
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/requests');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function toggleEmployeeActive(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const emp = await prisma.user.findUnique({ where: { id: userId } });
  if (!emp) return { error: 'Employee not found.' };

  await prisma.user.update({ where: { id: userId }, data: { active: !emp.active } });
  await writeAuditLog(admin.id, emp.active ? 'EMPLOYEE_DEACTIVATED' : 'EMPLOYEE_REACTIVATED', `${emp.firstName} ${emp.lastName}`);
  revalidatePath('/admin/employees');
  revalidatePath('/admin/dashboard');
  return { success: true };
}

export async function resetEmployeePassword(userId: string, newPassword: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (newPassword.length < 8) return { error: 'Password must be at least 8 characters.' };

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  await writeAuditLog(admin.id, 'PASSWORD_RESET', `Employee ${userId}`);
  return { success: true };
}

export async function createHoliday(
  input: z.infer<typeof holidaySchema>
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = holidaySchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const company = await getCompany();
  const holidayDate = new Date(`${parsed.data.date}T12:00:00Z`);
  const existingHoliday = await prisma.holiday.findUnique({
    where: { date_countryCode: { date: holidayDate, countryCode: company.countryCode } },
  });

  if (existingHoliday) {
    return { error: 'A holiday for that date already exists for the selected country.' };
  }

  await prisma.holiday.create({
    data: {
      name: parsed.data.name,
      date: holidayDate,
      year: holidayDate.getUTCFullYear(),
      countryCode: company.countryCode,
      companyId: company.id,
    },
  });

  await writeAuditLog(
    admin.id,
    "HOLIDAY_CREATED",
    `${parsed.data.name} on ${parsed.data.date}`
  );

  revalidatePath("/admin/holidays");
  revalidatePath("/admin/calendar");
  revalidatePath("/dashboard");

  return {
    success: true,
  };
}

export async function updateHoliday(id: string, input: z.infer<typeof holidaySchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = holidaySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  // Fetch existing holiday so the audit log can describe what changed
  const existing = await prisma.holiday.findUnique({ where: { id } });
  if (!existing) return { error: 'Holiday not found.' };

  const company = await getCompany();
  const newDate = new Date(`${parsed.data.date}T12:00:00Z`);
  const collision = await prisma.holiday.findFirst({
    where: {
      date: newDate,
      countryCode: company.countryCode,
      NOT: { id },
    },
  });

  if (collision) {
    return { error: 'A holiday for that date already exists for the selected country.' };
  }

  await prisma.holiday.update({
    where: { id },
    data: {
      name: parsed.data.name,
      date: newDate,
      year: newDate.getUTCFullYear(),
      countryCode: company.countryCode,
      companyId: company.id,
    },
  });

  const before = `${existing.name} on ${formatDateOnly(existing.date)}`;
  const after = `${parsed.data.name} on ${formatDateOnly(newDate)}`;
  await writeAuditLog(admin.id, 'HOLIDAY_UPDATED', `${before} → ${after}`);

  revalidatePath('/admin/holidays');
  revalidatePath('/admin/calendar');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteHoliday(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const existing = await prisma.holiday.findUnique({ where: { id } });
  if (!existing) return { error: 'Holiday not found.' };

  await prisma.holiday.delete({ where: { id } });
  await writeAuditLog(admin.id, 'HOLIDAY_DELETED', `${existing.name} on ${formatDateOnly(existing.date)}`);
  revalidatePath('/admin/holidays');
  revalidatePath('/admin/calendar');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function createDepartment(input: z.infer<typeof departmentSchema>): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };

  await prisma.department.create({ data: { name: parsed.data.name } });
  await writeAuditLog(admin.id, 'DEPARTMENT_CREATED', parsed.data.name);
  revalidatePath('/admin/employees');
  return { success: true };
}
