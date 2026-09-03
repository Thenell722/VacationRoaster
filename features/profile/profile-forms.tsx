'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { updateProfile, changePassword } from '@/actions/vacation';
import { profileUpdateSchema, passwordChangeSchema, type ProfileUpdateInput, type PasswordChangeInput } from '@/lib/validations';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ProfileInfo {
  firstName: string; lastName: string; email: string;
  role: string; departmentName: string | null; profileImage: string | null;
}

export function ProfileView({ profile }: { profile: ProfileInfo }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
        <CardDescription>Your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">{profile.firstName[0]}{profile.lastName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{profile.firstName} {profile.lastName}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{profile.role === 'ADMIN' ? 'Administrator' : 'Employee'}{profile.departmentName ? ` · ${profile.departmentName}` : ''}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfileForm({ profile }: { profile: ProfileInfo }) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { firstName: profile.firstName, lastName: profile.lastName, profileImage: profile.profileImage ?? '' },
  });

  async function onSubmit(values: ProfileUpdateInput) {
    setSaving(true);
    const res = await updateProfile(values);
    setSaving(false);
    if (res.error) toast.error(res.error);
    else toast.success('Profile updated');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit Profile</CardTitle>
        <CardDescription>Update your name and profile picture URL.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profileImage">Profile image URL (optional)</Label>
            <Input id="profileImage" placeholder="https://..." {...register('profileImage')} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function PasswordForm() {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(values: PasswordChangeInput) {
    setSaving(true);
    const res = await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
    setSaving(false);
    if (res.error) toast.error(res.error);
    else { toast.success('Password changed'); reset(); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change Password</CardTitle>
        <CardDescription>Use at least 8 characters with upper/lowercase and a number.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" {...register('currentPassword')} />
            {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" type="password" {...register('newPassword')} />
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />} Change password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
