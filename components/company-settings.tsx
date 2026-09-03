'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Globe2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateCompany } from '@/actions/company';
import { companyUpdateSchema, type CompanyUpdateInput } from '@/lib/validations';
import { formatDate } from '@/lib/date';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Company } from '@prisma/client';

interface CompanySettingsProps {
  company: Company;
  currentUserRole: string;
}

export function CompanySettings({ company, currentUserRole }: CompanySettingsProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [year, setYear] = useState(company.holidaySyncYear ?? new Date().getUTCFullYear());
  const [, startTransition] = useTransition();
  const isAdmin = currentUserRole === 'ADMIN';

  const { register, handleSubmit, formState: { errors } } = useForm<CompanyUpdateInput>({
    resolver: zodResolver(companyUpdateSchema),
    defaultValues: {
      name: company.name,
      countryCode: company.countryCode,
    },
  });

  async function onSubmit(values: CompanyUpdateInput) {
    setSaving(true);
    const res = await updateCompany(values);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Company settings updated');
      router.refresh();
    }
  }

  async function onSync() {
    if (!isAdmin) return;
    setIsSyncing(true);

    try {
      const response = await fetch('/api/holidays/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year }),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error ?? 'Unable to synchronize holidays.');
      }

      toast.success(`Synced ${result.total} public holidays for ${year}.`);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Info</CardTitle>
        <CardDescription>Manage the company profile and public holiday synchronization settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" disabled={!isAdmin} {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="countryCode">Country code</Label>
            <Input id="countryCode" disabled={!isAdmin} {...register('countryCode')} placeholder="US" />
            {errors.countryCode && <p className="text-xs text-destructive">{errors.countryCode.message}</p>}
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end">
            <Button type="button" onClick={handleSubmit(onSubmit)} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}Save company info
            </Button>
          </div>
        )}

        <div className="border-t pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe2 className="h-4 w-4" />
            <p className="font-medium">Public Holidays</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Country</p>
              <p className="mt-2 font-medium">{company.countryCode}</p>
            </div>
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Last synced</p>
              <p className="mt-2 font-medium">{company.holidaySyncAt ? formatDate(company.holidaySyncAt) : 'Never'}</p>
            </div>
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Synchronized year</p>
              <p className="mt-2 font-medium">{company.holidaySyncYear ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sync year</p>
              <Input
                type="number"
                min={1900}
                max={2100}
                value={year}
                onChange={(event) => setYear(event.target.value === '' ? new Date().getUTCFullYear() : Number(event.target.value))}
                disabled={!isAdmin || isSyncing}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Imported holidays are saved to the company holiday roster and can still be edited or deleted.</p>
            <Button
              onClick={onSync}
              disabled={!isAdmin || isSyncing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe2 className="mr-2 h-4 w-4" />}Sync Public Holidays
            </Button>
          </div>
          {!isAdmin && <p className="text-xs text-muted-foreground">Only administrators can synchronize public holidays.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
