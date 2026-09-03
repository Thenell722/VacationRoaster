import { requireAdmin } from '@/lib/session';
import { getAllUsers, getDepartments, getAllRequests } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { CreateEmployeeDialog } from '@/components/employee-dialogs';
import { AdminEmployeesTable } from '@/components/admin-employees-table';
import type { Department, User, VacationRequest } from '@prisma/client';

export default async function EmployeesPage() {
  const admin = await requireAdmin();
  const [users, departments, requests] = await Promise.all([getAllUsers(), getDepartments(), getAllRequests()]);

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" description="Manage employee accounts, departments, and vacation allowances." actions={<CreateEmployeeDialog departments={departments as Department[]} />} />
      <AdminEmployeesTable users={users as (User & { department?: Department | null })[]} departments={departments as Department[]} requests={requests as VacationRequest[]} currentAdminId={admin.id} />
    </div>
  );
}
