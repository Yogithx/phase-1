'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { Shield, LogOut } from 'lucide-react';

interface DashboardNavProps { role: string; email: string; }

export default function DashboardNav({ role, email }: DashboardNavProps) {
  const router = useRouter();
  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };
  const roleColors: Record<string, string> = {
    admin: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    faculty: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    counselor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  };
  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 glass-panel sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-indigo-400" />
        <span className="font-bold text-white text-sm">ESS Dashboard</span>
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize border ${roleColors[role] ?? 'text-slate-400 bg-slate-800 border-slate-600'}`}>{role}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-400 hidden sm:block">{email}</span>
        <button id="logout-btn" onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>
    </nav>
  );
}
