'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Profile } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/constants';
import { canToggleUserStatus } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Loader2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AllUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const { createBrowserSupabaseClient } = await import('@/lib/supabase/client');
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data || []) as Profile[]);
    setLoading(false);
  }

  const toggleActive = async (id: string, current: boolean, targetRole: string) => {
    if (!canToggleUserStatus(currentUser?.role || '', targetRole)) {
      toast.error('You do not have permission to modify this user');
      return;
    }
    const { createBrowserSupabaseClient } = await import('@/lib/supabase/client');
    const supabase = createBrowserSupabaseClient();
    await supabase.from('profiles').update({ is_active: !current }).eq('id', id);
    toast.success(`User ${current ? 'deactivated' : 'activated'}`);
    loadUsers();
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.full_name.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>All Users</h1>
          <p className="text-sm text-[var(--on-surface-variant)]">{filtered.length} users</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--outline)]" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="glass-input !pl-10 !py-2.5" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="glass-input !py-2.5 w-full sm:w-44">
            <option value="all">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" /></div>
        ) : (
          <div className="grid gap-2">
            {filtered.map(u => (
              <div key={u.id} className="glass-card p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[var(--glass-bg)] flex items-center justify-center text-sm font-bold flex-shrink-0">{u.full_name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{u.full_name}</p>
                    <p className="text-xs text-[var(--outline)]">{u.phone || 'No phone'} • {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${u.is_active ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--danger-bg)] text-[var(--danger)]'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {canToggleUserStatus(currentUser?.role || '', u.role) && u.id !== currentUser?.id && (
                    <button onClick={() => toggleActive(u.id, u.is_active, u.role)} className="p-1.5 rounded-lg hover:bg-[var(--glass-bg)]">
                      {u.is_active ? <ToggleRight className="w-5 h-5 text-[var(--success)]" /> : <ToggleLeft className="w-5 h-5 text-[var(--outline)]" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
