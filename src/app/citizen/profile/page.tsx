'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useAuth } from '@/lib/auth-context';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { createBrowserSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.from('profiles').update({
        full_name: name.trim(),
        phone: phone.trim() || null,
      }).eq('id', user?.id);

      if (error) { toast.error(error.message); return; }
      toast.success('Profile updated!');
      refreshUser();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-8" style={{ fontFamily: 'var(--font-display)' }}>My Profile</h1>
        <div className="glass-card p-6 sm:p-8 rounded-2xl">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--glass-border)]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] flex items-center justify-center text-2xl font-bold text-[var(--on-primary)]">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-lg font-bold">{user?.full_name}</p>
              <p className="text-sm text-[var(--outline)]">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[var(--on-surface-variant)] mb-2">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="glass-input" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--on-surface-variant)] mb-2">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="glass-input" placeholder="+91 0000000000" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--on-surface-variant)] mb-2">Email</label>
              <input type="email" value={user?.email || ''} disabled className="glass-input opacity-60" />
              <p className="text-xs text-[var(--outline)] mt-1">Email cannot be changed</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full !py-3 mt-6">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
