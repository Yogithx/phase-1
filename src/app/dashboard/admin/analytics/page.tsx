'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import {
  BarChart2, TrendingUp, CheckCircle2, AlertTriangle,
  Activity, LogOut, Shield, LayoutDashboard, Building2,
  FileText, PieChart, Target, Zap,
} from 'lucide-react';

const INTERVENTION_STATS = { total: 90, inProgress: 23, completed: 52, escalated: 5, successRate: 78 };

const ROOT_CAUSE_DIST = [
  { label: 'Academic Difficulty', pct: 28, count: 25, color: 'bg-indigo-500', text: 'text-indigo-300' },
  { label: 'Motivational',        pct: 20, count: 18, color: 'bg-violet-500', text: 'text-violet-300' },
  { label: 'Financial Hardship',  pct: 17, count: 15, color: 'bg-amber-500',  text: 'text-amber-300'  },
  { label: 'Multiple Factors',    pct: 13, count: 12, color: 'bg-orange-500', text: 'text-orange-300' },
  { label: 'Social Isolation',    pct: 11, count: 10, color: 'bg-sky-500',    text: 'text-sky-300'    },
  { label: 'Health-Related',      pct: 9,  count: 8,  color: 'bg-teal-500',   text: 'text-teal-300'   },
  { label: 'Uncertain',           pct: 2,  count: 2,  color: 'bg-slate-500',  text: 'text-slate-400'  },
];

const TREND_WEEKS = [
  { week: 'Wk 1', score: 0.45, interventions: 8  },
  { week: 'Wk 2', score: 0.46, interventions: 10 },
  { week: 'Wk 3', score: 0.48, interventions: 12 },
  { week: 'Wk 4', score: 0.47, interventions: 9  },
  { week: 'Wk 5', score: 0.49, interventions: 14 },
  { week: 'Wk 6', score: 0.50, interventions: 13 },
  { week: 'Wk 7', score: 0.51, interventions: 15 },
  { week: 'Wk 8', score: 0.52, interventions: 9  },
];

const EFFECTIVENESS = { completed: 52, improved: 33, deteriorated: 9, noChange: 10 };

const INTERVENTION_TYPE_BREAKDOWN = [
  { type: 'Academic Tutoring',      count: 22, completed: 16, successRate: 81 },
  { type: 'Counsellor Check-In',    count: 18, completed: 14, successRate: 86 },
  { type: 'Peer Mentoring',         count: 15, completed: 10, successRate: 70 },
  { type: 'Financial Aid Referral', count: 12, completed: 6,  successRate: 67 },
  { type: 'Health Centre Referral', count: 8,  completed: 4,  successRate: 75 },
  { type: 'Faculty Mentoring',      count: 10, completed: 2,  successRate: 50 },
];

const NAV_ITEMS = [
  { label: 'Overview',    icon: LayoutDashboard, href: '/dashboard/admin',           active: false },
  { label: 'Departments', icon: Building2,       href: '/dashboard/admin#departments', active: false },
  { label: 'Analytics',   icon: BarChart2,       href: '/dashboard/admin/analytics',  active: true  },
  { label: 'Reports',     icon: FileText,        href: '#',                            active: false },
];

function DualTrendChart() {
  const W = 640, H = 150, PAD = { top: 16, right: 24, bottom: 36, left: 52 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const minR = 0.40, maxR = 0.60;
  const yScoreScale = (s: number) => innerH - ((s - minR) / (maxR - minR)) * innerH;
  const yIvScale    = (n: number) => innerH - (n / 20) * innerH;
  const xStep = innerW / (TREND_WEEKS.length - 1);
  const scorePoints = TREND_WEEKS.map((d, i) => ({ x: PAD.left + i * xStep, y: PAD.top + yScoreScale(d.score), ...d }));
  const ivPoints    = TREND_WEEKS.map((d, i) => ({ x: PAD.left + i * xStep, y: PAD.top + yIvScale(d.interventions), ...d }));
  const scorePoly = scorePoints.map(p => `${p.x},${p.y}`).join(' ');
  const ivPoly    = ivPoints.map(p => `${p.x},${p.y}`).join(' ');
  const scoreArea = [`M ${scorePoints[0].x} ${PAD.top + innerH}`, ...scorePoints.map(p => `L ${p.x} ${p.y}`), `L ${scorePoints[scorePoints.length - 1].x} ${PAD.top + innerH}`, 'Z'].join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minHeight: 130 }}>
      <defs>
        <linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.43, 0.47, 0.51, 0.55].map(v => {
        const y = PAD.top + yScoreScale(v);
        if (y < PAD.top || y > PAD.top + innerH) return null;
        return <g key={v}><line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} /><text x={PAD.left - 6} y={y + 4} fontSize={9} fill="#64748b" textAnchor="end">{v.toFixed(2)}</text></g>;
      })}
      <path d={scoreArea} fill="url(#sGrad)" />
      <polyline points={scorePoly} fill="none" stroke="#f97316" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={ivPoly}    fill="none" stroke="#818cf8" strokeWidth={2}   strokeDasharray="5 3" strokeLinejoin="round" strokeLinecap="round" />
      {scorePoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#f97316" stroke="#0f172a" strokeWidth={1.5} />)}
      {scorePoints.map((p, i) => <text key={i} x={p.x} y={H - 8} fontSize={10} fill="#64748b" textAnchor="middle">{p.week}</text>)}
    </svg>
  );
}

function EffectivenessDonut() {
  const { improved, deteriorated, noChange, completed } = EFFECTIVENESS;
  const R = 55, cx = 70, cy = 70, sw = 22;
  const circ = 2 * Math.PI * R;
  const items = [
    { val: improved, color: '#10b981' },
    { val: noChange, color: '#64748b' },
    { val: deteriorated, color: '#ef4444' },
  ];
  let offset = 0;
  const slices = items.map(it => {
    const dash = (it.val / completed) * circ;
    const s = { ...it, dashArray: `${dash} ${circ - dash}`, dashOffset: -offset };
    offset += dash;
    return s;
  });
  return (
    <svg viewBox="0 0 140 140" className="w-full max-w-[140px] mx-auto">
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={s.color} strokeWidth={sw}
          strokeDasharray={s.dashArray} strokeDashoffset={s.dashOffset}
          strokeLinecap="butt" transform={`rotate(-90 ${cx} ${cy})`} opacity={0.85} />
      ))}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize={18} fontWeight="800" fill="white">{INTERVENTION_STATS.successRate}%</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize={8}  fill="#94a3b8">success</text>
    </svg>
  );
}

function StatCard({ label, value, sub, icon, accent, large }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; accent: string; large?: boolean;
}) {
  return (
    <div className={`glass-panel rounded-2xl p-5 border ${accent} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className="opacity-60">{icon}</span>
      </div>
      <div className={`font-extrabold text-white tabular-nums ${large ? 'text-5xl' : 'text-4xl'}`}>{value}</div>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default function AdminAnalytics() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'effectiveness'>('overview');

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const imprvPct = Math.round((EFFECTIVENESS.improved     / EFFECTIVENESS.completed) * 100);
  const detrPct  = Math.round((EFFECTIVENESS.deteriorated / EFFECTIVENESS.completed) * 100);
  const nochPct  = Math.round((EFFECTIVENESS.noChange     / EFFECTIVENESS.completed) * 100);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 border-b border-white/10 glass-panel">
        <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white text-sm">ESS — Analytics</span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border text-indigo-400 bg-indigo-500/10 border-indigo-500/30">admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 hidden sm:block">admin@college.edu</span>
            <button id="analytics-logout-btn" onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        <aside className="w-52 shrink-0 border-r border-white/8 py-6 px-3 hidden md:flex flex-col gap-1 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <Link key={item.label} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                item.active ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
              <item.icon className="w-4 h-4 shrink-0" />{item.label}
            </Link>
          ))}
          <div className="mt-auto pt-4 border-t border-white/8">
            <p className="text-xs text-slate-600 px-3">ESS v2.0 · Phase 3</p>
            <p className="text-xs text-slate-600 px-3 mt-0.5">No PII in analytics</p>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-8 space-y-10 overflow-x-hidden">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
              <p className="text-slate-400 text-sm mt-1">Aggregated intervention &amp; risk statistics · No individual student data</p>
            </div>
            <div className="flex gap-1 bg-slate-900/60 border border-white/8 rounded-xl p-1">
              {(['overview', 'effectiveness'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}>{tab}</button>
              ))}
            </div>
          </div>

          {/* SECTION 1: INTERVENTION STATS */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Intervention Statistics</h2>
              <div className="flex-1 h-px bg-white/5 ml-2" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Total Created"        value={INTERVENTION_STATS.total}       icon={<Target      className="w-5 h-5 text-indigo-400" />} accent="border-indigo-500/20" />
              <StatCard label="In Progress"          value={INTERVENTION_STATS.inProgress}  icon={<Zap         className="w-5 h-5 text-amber-400"  />} accent="border-amber-500/20"  sub={`${Math.round(INTERVENTION_STATS.inProgress / INTERVENTION_STATS.total * 100)}% of total`} />
              <StatCard label="Completed"            value={INTERVENTION_STATS.completed}   icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} accent="border-emerald-500/20" sub={`${Math.round(INTERVENTION_STATS.completed / INTERVENTION_STATS.total * 100)}% completion rate`} />
              <StatCard label="Escalated"            value={INTERVENTION_STATS.escalated}   icon={<AlertTriangle className="w-5 h-5 text-red-400" />}     accent="border-red-500/20"     sub="Referred for higher support" />
              <StatCard label="Success Rate" large   value={`${INTERVENTION_STATS.successRate}%`} icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} accent="border-emerald-500/20" sub="Completed with positive outcome" />
            </div>
          </section>

          {activeTab === 'overview' ? (
            <>
              {/* SECTION 2: ROOT CAUSE DISTRIBUTION */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-base font-bold text-white">Root Cause Distribution</h2>
                  <span className="text-xs text-slate-500 ml-1">Last 30 days</span>
                  <div className="flex-1 h-px bg-white/5 ml-2" />
                </div>
                <div className="glass-panel rounded-2xl p-6 space-y-4">
                  {ROOT_CAUSE_DIST.map(rc => (
                    <div key={rc.label} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-48 shrink-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${rc.color}`} />
                        <span className="text-xs text-slate-300">{rc.label}</span>
                      </div>
                      <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden relative">
                        <div className={`h-full rounded-lg ${rc.color} opacity-75`} style={{ width: `${rc.pct * 3.57}%` }} />
                        <span className="absolute inset-0 flex items-center pl-3 text-xs font-semibold text-white/90">{rc.count} cases</span>
                      </div>
                      <span className={`text-sm font-bold tabular-nums w-12 text-right ${rc.text}`}>{rc.pct}%</span>
                    </div>
                  ))}
                  <p className="text-xs text-slate-600 pt-2 border-t border-white/5">Data aggregated across all departments · No individual identification</p>
                </div>
              </section>

              {/* SECTION 3: RISK TREND */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <h2 className="text-base font-bold text-white">Risk Score &amp; Intervention Volume Trend</h2>
                  <span className="text-xs text-slate-500 ml-1">Last 8 weeks</span>
                  <div className="flex-1 h-px bg-white/5 ml-2" />
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full">
                    <AlertTriangle className="w-3 h-3" />Trending ↑
                  </span>
                </div>
                <div className="glass-panel rounded-2xl p-6">
                  <div className="flex items-center gap-6 mb-4 text-xs text-slate-400 flex-wrap">
                    <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-orange-500 rounded" /><span>Avg Risk Score (0.00–1.00)</span></div>
                    <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-indigo-400 rounded" /><span>Weekly Interventions</span></div>
                  </div>
                  <DualTrendChart />
                  <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5">
                    {[
                      { label: 'Starting risk', value: '0.45', color: 'text-slate-400' },
                      { label: 'Current risk',  value: '0.52', color: 'text-orange-400' },
                      { label: 'Total change',  value: '+15.5%', color: 'text-red-400' },
                      { label: 'Peak ivtns/wk', value: '15', color: 'text-indigo-400' },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <p className={`text-lg font-extrabold tabular-nums ${m.color}`}>{m.value}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* SECTION 4: EFFECTIVENESS */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">Intervention Effectiveness</h2>
                  <span className="text-xs text-slate-500 ml-1">Based on {EFFECTIVENESS.completed} completed</span>
                  <div className="flex-1 h-px bg-white/5 ml-2" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="glass-panel rounded-2xl p-6">
                    <div className="flex items-center gap-6">
                      <div className="shrink-0 w-[140px]"><EffectivenessDonut /></div>
                      <div className="flex-1 space-y-4">
                        {[
                          { label: 'Improved after intervention', count: EFFECTIVENESS.improved,     pct: imprvPct, color: 'bg-emerald-500', text: 'text-emerald-300' },
                          { label: 'No significant change',       count: EFFECTIVENESS.noChange,     pct: nochPct,  color: 'bg-slate-500',   text: 'text-slate-400' },
                          { label: 'Risk deteriorated',           count: EFFECTIVENESS.deteriorated, pct: detrPct,  color: 'bg-red-500',     text: 'text-red-300'   },
                        ].map(item => (
                          <div key={item.label}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-400">{item.label}</span>
                              <span className={`font-bold ${item.text}`}>{item.count} ({item.pct}%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-2xl p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">Success Rate by Intervention Type</p>
                    <div className="space-y-3">
                      {INTERVENTION_TYPE_BREAKDOWN.sort((a, b) => b.successRate - a.successRate).map(item => (
                        <div key={item.type} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-44 shrink-0">{item.type}</span>
                          <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden relative">
                            <div className={`h-full rounded ${item.successRate >= 80 ? 'bg-emerald-500' : item.successRate >= 65 ? 'bg-amber-500' : 'bg-red-500'} opacity-75`} style={{ width: `${item.successRate}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-slate-300 w-8 text-right font-semibold">{item.successRate}%</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 pt-3 mt-3 border-t border-white/5">Success = completed with documented improvement · No individual identification</p>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-base font-bold text-white">Volume by Type</h2>
                  <div className="flex-1 h-px bg-white/5 ml-2" />
                </div>
                <div className="glass-panel rounded-2xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/8 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-3 text-left">Intervention Type</th>
                        <th className="px-5 py-3 text-right">Total</th>
                        <th className="px-5 py-3 text-right">Completed</th>
                        <th className="px-5 py-3 text-right">Success Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {INTERVENTION_TYPE_BREAKDOWN.map((item, i) => (
                        <tr key={item.type} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                          <td className="px-5 py-3 font-medium text-white">{item.type}</td>
                          <td className="px-5 py-3 text-right text-slate-300 tabular-nums">{item.count}</td>
                          <td className="px-5 py-3 text-right text-slate-300 tabular-nums">{item.completed}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`text-xs font-bold tabular-nums ${item.successRate >= 80 ? 'text-emerald-400' : item.successRate >= 65 ? 'text-amber-400' : 'text-red-400'}`}>{item.successRate}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
