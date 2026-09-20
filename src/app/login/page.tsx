'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { Shield, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createSupabaseBrowser();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    const role = data.user?.user_metadata?.role as string | undefined;
    if (!role) {
      const { data: userRow } = await supabase.from('users').select('role').eq('email', email.trim()).single();
      router.push(`/dashboard/${userRow?.role ?? 'admin'}`);
    } else {
      router.push(`/dashboard/${role}`);
    }
    router.refresh();
  };

  const fillDemo = (role: 'admin' | 'faculty' | 'counselor') => {
    setEmail(`${role}@college.edu`);
    setPassword('demo123');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
            <Shield className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">ESS — Staff Portal</h1>
            <p className="text-slate-400 text-sm mt-1">Early Student Support System</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button id="login-submit" type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : 'Sign In'}
            </button>
          </form>
          <div className="border-t border-white/8 pt-5 space-y-3">
            <p className="text-xs text-slate-500 text-center">Demo accounts — click to auto-fill</p>
            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'faculty', 'counselor'] as const).map(role => (
                <button key={role} id={`demo-${role}`} type="button" onClick={() => fillDemo(role)}
                  className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/8 text-xs font-medium text-slate-300 hover:text-white capitalize transition-all">
                  {role}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-600 text-center font-mono">Password: demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
