'use client';

import { useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/empty-state';
import { CreateEmployeeDialog, DeleteEmployeeButton, EditEmployeeDialog, ResetPasswordDialog, ToggleActiveButton } from '@/components/employee-dialogs';
import type { Department, User, VacationRequest } from '@prisma/client';

type EmployeeRow = User & { department?: Department | null };

interface AdminEmployeesTableProps {
  users: EmployeeRow[];
  departments: Department[];
  requests: VacationRequest[];
  currentAdminId: string;
}

export function AdminEmployeesTable({ users, departments, requests, currentAdminId }: AdminEmployeesTableProps) {
  const [search, setSearch] = useState('');

  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);
  const approvedDaysByEmployee = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of requests) {
      if (r.status === 'APPROVED') {
        map.set(r.employeeId, (map.get(r.employeeId) ?? 0) + r.workingDays);
      }
    }
    return map;
  }, [requests]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((emp) => {
      const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const email = emp.email.toLowerCase();
      const departmentName = (emp.departmentId ? deptMap.get(emp.departmentId) ?? '' : '').toLowerCase();
      return name.includes(query) || email.includes(query) || departmentName.includes(query) || emp.role.toLowerCase().includes(query);
    });
  }, [users, search, deptMap]);

  if (users.length === 0) {
    return <EmptyState icon={Users} title="No employees" description="Add your first employee to get started." />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees by name, email, department, or role"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {filteredUsers.length === 0 ? (
        <EmptyState icon={Users} title="No employees found" description="Try a different search term." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 font-medium">Employees</th>
                    <th className="px-3 py-3 font-medium">Department</th>
                    <th className="px-3 py-3 font-medium">Role</th>
                    <th className="px-3 py-3 font-medium">Allowance</th>
                    <th className="px-3 py-3 font-medium w-28 md:w-36">Used</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((emp) => {
                    const used = approvedDaysByEmployee.get(emp.id) ?? 0;
                    const total = emp.annualAllowance + emp.carryOverDays;
                    return (
                      <tr key={emp.id} className="hover:bg-muted/30">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">{emp.firstName[0]}{emp.lastName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                              <p className="text-xs text-muted-foreground break-words max-w-xs">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{emp.departmentId ? deptMap.get(emp.departmentId) ?? '—' : '—'}</td>
                        <td className="px-3 py-3">
                          <Badge variant={emp.role === 'ADMIN' ? 'default' : 'secondary'}>{emp.role === 'ADMIN' ? 'Admin' : 'Employee'}</Badge>
                        </td>
                        <td className="px-3 py-3">{total} days</td>
                        <td className="px-3 py-3 whitespace-nowrap w-28 md:w-36">
                          <span className={used > total ? 'text-destructive font-medium' : ''}>{used}</span>
                          <span className="text-muted-foreground"> / {total}</span>
                        </td>
                        <td className="px-3 py-3">
                          {emp.active ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900">Active</Badge> : <Badge variant="secondary" className="bg-slate-100 text-slate-500">Inactive</Badge>}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <EditEmployeeDialog employee={emp} departments={departments} />
                            <ResetPasswordDialog employee={emp} />
                            <ToggleActiveButton employee={emp} currentAdminId={currentAdminId} />
                            <DeleteEmployeeButton employee={emp} currentAdminId={currentAdminId} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
