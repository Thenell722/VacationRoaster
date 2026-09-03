import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const departments = [];
  for (const name of ['Engineering', 'Sales', 'Marketing', 'Operations', 'Human Resources']) {
    const dept = await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
    departments.push(dept);
  }

  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      firstName: 'Alex', lastName: 'Morgan', email: 'admin@example.com',
      password, role: 'ADMIN', departmentId: departments[0].id,
      annualAllowance: 30, carryOverDays: 0,
    },
  });

  const employeeData: [string, string, number, number, number][] = [
    ['Jordan', 'Lee', 0, 25, 3],
    ['Sam', 'Patel', 0, 25, 0],
    ['Casey', 'Nguyen', 1, 25, 2],
    ['Riley', 'Garcia', 1, 25, 0],
    ['Morgan', 'Kim', 2, 25, 1],
    ['Avery', 'Chen', 2, 25, 0],
    ['Taylor', 'Brooks', 3, 25, 4],
    ['Jamie', 'Rivera', 3, 25, 0],
    ['Drew', 'Holloway', 4, 25, 2],
    ['Reese', 'Owens', 0, 25, 0],
  ];

  const employees = [];
  for (let i = 0; i < employeeData.length; i++) {
    const [first, last, deptIdx, allowance, carry] = employeeData[i];
    const email = `emp${i + 1}@example.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        firstName: first, lastName: last, email, password,
        role: 'EMPLOYEE', departmentId: departments[deptIdx].id,
        annualAllowance: allowance, carryOverDays: carry,
      },
    });
    employees.push(user);
  }

  const year = new Date().getFullYear();
  const holidays = [
    { name: "New Year's Day", date: new Date(year, 0, 1) },
    { name: 'Memorial Day', date: new Date(year, 4, 26) },
    { name: 'Independence Day', date: new Date(year, 6, 4) },
    { name: 'Labor Day', date: new Date(year, 8, 2) },
    { name: 'Thanksgiving', date: new Date(year, 10, 27) },
    { name: 'Day after Thanksgiving', date: new Date(year, 10, 28) },
    { name: 'Christmas Eve', date: new Date(year, 11, 24) },
    { name: 'Christmas Day', date: new Date(year, 11, 25) },
  ];
  for (const h of holidays) {
    const existing = await prisma.holiday.findFirst({ where: { name: h.name } });
    if (!existing) await prisma.holiday.create({ data: h });
  }

  const existingReqs = await prisma.vacationRequest.count();
  if (existingReqs === 0) {
    await prisma.vacationRequest.createMany({
      data: [
        { employeeId: employees[0].id, startDate: new Date(year, 2, 10), endDate: new Date(year, 2, 14), workingDays: 5, reason: 'Family trip', status: 'APPROVED', managerComment: 'Enjoy!', approvedAt: new Date(), approvedById: admin.id },
        { employeeId: employees[1].id, startDate: new Date(year, 5, 16), endDate: new Date(year, 5, 20), workingDays: 5, reason: 'Beach vacation', status: 'APPROVED', managerComment: 'Approved', approvedAt: new Date(), approvedById: admin.id },
        { employeeId: employees[2].id, startDate: new Date(year, 6, 7), endDate: new Date(year, 6, 9), workingDays: 3, reason: 'Wedding', status: 'PENDING' },
        { employeeId: employees[3].id, startDate: new Date(year, 7, 11), endDate: new Date(year, 7, 15), workingDays: 5, reason: 'Staycation', status: 'PENDING' },
        { employeeId: employees[4].id, startDate: new Date(year, 3, 1), endDate: new Date(year, 3, 3), workingDays: 3, reason: 'Personal', status: 'REJECTED', managerComment: 'Too many people on leave', approvedAt: new Date(), approvedById: admin.id },
        { employeeId: employees[0].id, startDate: new Date(year, 10, 17), endDate: new Date(year, 10, 21), workingDays: 5, reason: 'Holidays', status: 'PENDING' },
      ],
    });
  }

  console.log('Seed complete.');
  console.log('Admin: admin@example.com / password123');
  console.log('Employee: emp1@example.com / password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
