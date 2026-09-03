import { getCompany } from '@/lib/data';
import { getSessionUser } from '@/lib/session';
import { PageHeader } from '@/components/page-header';
import { ProfileView, ProfileForm, PasswordForm } from '@/components/profile-forms';
import { CompanySettings } from '@/components/company-settings';

export default async function ProfilePage() {
  const profile = await getSessionUser();
  if (!profile) return null;
  const company = await getCompany();

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your account details, company settings, and public holiday synchronization." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ProfileView profile={profile} />
          <ProfileForm profile={profile} />
          
        </div>
        <PasswordForm />
      </div>
    </div>
  );
}
