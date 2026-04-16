import { DashboardShell } from '@/components/layout/DashboardShell';
import { ProfileSettings } from '@/components/profile/ProfileSettings';

export default function ProfilePage() {
  return (
    <DashboardShell>
      <ProfileSettings />
    </DashboardShell>
  );
}
