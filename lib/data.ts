import prisma from '@/lib/db';
import { formatDateOnly } from '@/lib/date';

export async function getCompany() {
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Vacation Roster',
        countryCode: 'US',
      },
    });
  }
  return company;
}

export async function getHolidays() {
  const company = await getCompany();
  return prisma.holiday.findMany({
    where: { companyId: company.id },
    orderBy: { date: 'asc' },
  });
}

export async function getDepartments() {
  return prisma.department.findMany({ orderBy: { name: 'asc' } });
}

export async function getEmployeeRequests(employeeId: string) {
  return prisma.vacationRequest.findMany({
    where: { employeeId },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, email: true, department: true } },
      approver: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllRequests() {
  return prisma.vacationRequest.findMany({
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, email: true, departmentId: true, department: true } },
      approver: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({ include: { department: true }, orderBy: { createdAt: 'asc' } });
}

export function computeBalance(
  profile: { annualAllowance: number; carryOverDays: number },
  requests: { status: string; workingDays: number }[],
) {
  const approvedDays = requests.filter((r) => r.status === 'APPROVED').reduce((s, r) => s + r.workingDays, 0);
  const pendingDays = requests.filter((r) => r.status === 'PENDING').reduce((s, r) => s + r.workingDays, 0);
  const remaining = profile.annualAllowance + profile.carryOverDays - approvedDays;
  return { annualAllowance: profile.annualAllowance, carryOverDays: profile.carryOverDays, approvedDays, pendingDays, remaining };
}

/**
 * Writes an audit log entry and attempts to enrich the details into a human-friendly
 * description when possible. The function is intentionally tolerant — if enrichment
 * fails it falls back to the provided details string.
 */
export async function writeAuditLog(userId: string, action: string, details?: string | null) {
  let desc: string | null = details ?? null;

  try {
    if (details) {
      // Match 'Request <id>' and expand to 'Firstname Lastname — YYYY-MM-DD → YYYY-MM-DD (N days)'
      const reqMatch = /Request\s+([A-Za-z0-9_-]+)/.exec(details);
      if (reqMatch) {
        const req = await prisma.vacationRequest.findUnique({ where: { id: reqMatch[1] }, include: { employee: { select: { firstName: true, lastName: true } } } });
        if (req) {
          desc = `${req.employee?.firstName ?? 'Employee'} ${req.employee?.lastName ?? ''} — ${formatDateOnly(req.startDate)} → ${formatDateOnly(req.endDate)} (${req.workingDays} days)`;
        }
      }

      // Match 'Employee <id>' and expand to 'Firstname Lastname (email)'
      const empMatch = /Employee\s+([A-Za-z0-9_-]+)/.exec(details);
      if (empMatch) {
        const u = await prisma.user.findUnique({ where: { id: empMatch[1] } });
        if (u) desc = `${u.firstName} ${u.lastName} (${u.email})`;
      }

      // Match 'Holiday <id>' and expand to 'Name on YYYY-MM-DD'
      const holMatch = /Holiday\s+([A-Za-z0-9_-]+)/.exec(details);
      if (holMatch) {
        const h = await prisma.holiday.findUnique({ where: { id: holMatch[1] } });
        if (h) desc = `${h.name} on ${formatDateOnly(h.date)}`;
      }

      // If details already look like 'Name on YYYY-MM-DD' (createHoliday uses that), keep as-is
    } else {
      // No details provided — provide reasonable defaults for common actions
      if (action === 'PASSWORD_CHANGED') desc = 'Password changed';
      if (action === 'DEPARTMENT_CREATED') desc = 'Department created';
      // leave other actions null if no additional context is available
    }
  } catch (e) {
    // Ignore enrichment errors and fall back to provided details
    desc = details ?? null;
  }

  return prisma.auditLog.create({ data: { userId, action, details: desc ?? null } });
}
