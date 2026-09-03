'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserPlus, Power, KeyRound, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createEmployee, updateEmployee, toggleEmployeeActive, resetEmployeePassword, deleteEmployee } from '@/actions/admin';
import { employeeCreateSchema, employeeEditSchema, type EmployeeCreateInput, type EmployeeEditInput } from '@/lib/validations';
import type { Department, User } from '@prisma/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export function CreateEmployeeDialog({ departments }: { departments: Department[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<EmployeeCreateInput>({ resolver: zodResolver(employeeCreateSchema), defaultValues: { firstName: '', lastName: '', email: '', password: '', departmentId: null, annualAllowance: 25, carryOverDays: 0, role: 'EMPLOYEE' } });
  async function onSubmit(values: EmployeeCreateInput) {
    startTransition(async () => { const res = await createEmployee(values); if (res.error) toast.error(res.error); else { toast.success('Employee created'); reset(); setOpen(false); router.refresh(); } });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700"><UserPlus className="mr-2 h-4 w-4" /> Add Employee</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Employee</DialogTitle><DialogDescription>Create a new user account and profile.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>First name</Label><Input {...register('firstName')} />{errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}</div><div className="space-y-2"><Label>Last name</Label><Input {...register('lastName')} />{errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}</div></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" {...register('email')} />{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}</div>
          <div className="space-y-2"><Label>Temporary password</Label><Input type="password" {...register('password')} />{errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Department</Label><Select onValueChange={(v) => setValue('departmentId', v)}><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Role</Label><Select defaultValue="EMPLOYEE" onValueChange={(v) => setValue('role', v as 'EMPLOYEE' | 'ADMIN')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EMPLOYEE">Employee</SelectItem><SelectItem value="ADMIN">Administrator</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Annual allowance (days)</Label><Input type="number" {...register('annualAllowance', { valueAsNumber: true })} /></div><div className="space-y-2"><Label>Carry-over days</Label><Input type="number" {...register('carryOverDays', { valueAsNumber: true })} /></div></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700">{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Employee</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditEmployeeDialog({ employee, departments }: { employee: User & { department?: Department | null }; departments: Department[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EmployeeEditInput>({ resolver: zodResolver(employeeEditSchema), defaultValues: { firstName: employee.firstName, lastName: employee.lastName, email: employee.email, departmentId: employee.departmentId ?? null, annualAllowance: employee.annualAllowance, carryOverDays: employee.carryOverDays, active: employee.active, role: employee.role as 'ADMIN' | 'EMPLOYEE' } });
  const active = watch('active');
  async function onSubmit(values: EmployeeEditInput) {
    startTransition(async () => { const res = await updateEmployee(employee.id, values); if (res.error) toast.error(res.error); else { toast.success('Employee updated'); setOpen(false); router.refresh(); } });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="sm">Edit</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit {employee.firstName} {employee.lastName}</DialogTitle><DialogDescription>Update employee details and allowance.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>First name</Label><Input {...register('firstName')} />{errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}</div><div className="space-y-2"><Label>Last name</Label><Input {...register('lastName')} />{errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}</div></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" {...register('email')} />{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Department</Label><Select defaultValue={employee.departmentId ?? undefined} onValueChange={(v) => setValue('departmentId', v)}><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Role</Label><Select defaultValue={employee.role} onValueChange={(v) => setValue('role', v as 'ADMIN' | 'EMPLOYEE')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EMPLOYEE">Employee</SelectItem><SelectItem value="ADMIN">Administrator</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Annual allowance</Label><Input type="number" {...register('annualAllowance', { valueAsNumber: true })} /></div><div className="space-y-2"><Label>Carry-over days</Label><Input type="number" {...register('carryOverDays', { valueAsNumber: true })} /></div></div>
          <div className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">Active</p><p className="text-xs text-muted-foreground">Inactive employees cannot sign in or submit requests.</p></div><Switch checked={active} onCheckedChange={(v) => setValue('active', v)} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700">{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ResetPasswordDialog({ employee }: { employee: User }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState('');
  async function handleReset() { startTransition(async () => { const res = await resetEmployeePassword(employee.id, password); if (res.error) toast.error(res.error); else { toast.success('Password reset'); setPassword(''); setOpen(false); } }); }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="sm"><KeyRound className="mr-1 h-3 w-3" /> Reset</Button></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Reset password</DialogTitle><DialogDescription>Set a new temporary password for {employee.firstName}.</DialogDescription></DialogHeader>
        <div className="space-y-2"><Label htmlFor="new-pw">New password</Label><Input id="new-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleReset} disabled={pending || password.length < 8}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Reset password</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteEmployeeButton({ employee, currentAdminId }: { employee: User; currentAdminId?: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();
  const disabled = Boolean(currentAdminId && employee.id === currentAdminId) || employee.role === 'ADMIN';

  function handleDelete() {
    if (disabled) return;

    startTransition(async () => {
      const res = await deleteEmployee(employee.id);
      if (res.error) toast.error(res.error);
      else { toast.success('Employee deleted'); setConfirmOpen(false); router.refresh(); }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={disabled ? 'cursor-not-allowed text-muted-foreground' : 'text-destructive hover:text-destructive'}
        onClick={() => setConfirmOpen(true)}
        disabled={disabled}
      >
        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {employee.firstName} {employee.lastName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove their account and any vacation requests submitted by them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={pending || disabled} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ToggleActiveButton({ employee, currentAdminId }: { employee: User; currentAdminId?: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();
  const disabled = Boolean(currentAdminId && employee.id === currentAdminId) || employee.role === 'ADMIN';

  function handleToggle() {
    if (disabled) return;
    startTransition(async () => { const res = await toggleEmployeeActive(employee.id); if (res.error) toast.error(res.error); else { toast.success(employee.active ? 'Employee deactivated' : 'Employee reactivated'); setConfirmOpen(false); router.refresh(); } });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={disabled
          ? 'cursor-not-allowed text-muted-foreground min-w-[8rem]'
          : `min-w-[8rem] ${employee.active ? 'text-destructive hover:text-destructive' : 'text-emerald-600 hover:text-emerald-700'}`}
        onClick={() => { if (!disabled) setConfirmOpen(true); }}
        disabled={disabled}
      >
        <Power className="mr-1 h-3.5 w-3.5" />
        {employee.active ? 'Deactivate' : 'Reactivate'}
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{employee.active ? 'Deactivate' : 'Reactivate'} {employee.firstName}?</AlertDialogTitle><AlertDialogDescription>{employee.active ? 'They will no longer be able to sign in or submit requests.' : 'They will regain access to the system.'}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleToggle} disabled={pending || disabled}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
