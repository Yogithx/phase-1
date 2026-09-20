'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import {
  Users, AlertTriangle, Activity, BarChart2,
  LogOut, Shield, LayoutDashboard, Building2,
  PieChart, FileText, ChevronUp, ChevronDown,
  ChevronsUpDown, TrendingUp, ArrowUpRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Department {
  id: number;
  name: string;
  students: number;
  avgAttendance: number;
  avgScore: number;
  pctRequiringSupport: number;
  activeInterventions: number;
  completionRate: number;
}

type SortKey = keyof Department;
type SortDir = 'asc' | 'desc';

// ─── Synthetic data ───────────────────────────────────────────────────────────

const DEPARTMENTS: Department[] = [
  { id: 1, name: 'Computer Science & Engineering', students: 78, avgAttendance: 76, avgScore: 68, pctRequiringSupport: 19, activeInterventions: 5, completionRate: 72 },
  { id: 2, name: 'Data Science & AI',              students: 52, avgAttendance: 80, avgScore: 71, pctRequiringSupport: 14, activeInterventions: 3, completionRate: 80 },
  { id: 3, name: 'Electronics & Communication',    students: 65, avgAttendance: 73, avgScore: 64, pctRequiringSupport: 20, activeInterventions: 4, completionRate: 68 },
  { id: 4, name: 'Mechanical Engineering',         students: 60, avgAttendance: 70, avgScore: 61, pctRequiringSupport: 23, activeInterventions: 4, completionRate: 60 },
  { id: 5, name: 'Business Information Systems',   students: 48, avgAttendance: 82, avgScore: 74, pctRequiringSupport: 10, activeInterventions: 2, completionRate: 85 },
  { id: 6, name: 'Civil Engineering',              students: 55, avgAttendance: 68, avgScore: 59, pctRequiringSupport: 25, activeInterventions: 3, completionRate: 55 },
  { id: 7, name: 'Electrical Engineering',         students: 57, avgAttendance: 75, avgScore: 66, pctRequiringSupport: 17, activeInterventions: 2, completionRate: 70 },
  { id: 8, name: 'Information Technology',         students: 35, avgAttendance: 84, avgScore: 76, pctRequiringSupport: 8,  activeInterventions: 0, completionRate: 90 },
];

const RISK_DISTRIBUTION = [
  { tier: 'GREEN',    pct: 45, color: 'bg-emerald-500', text: 'text-emerald-300', border: 'border-emerald-500/30', count: 202 },
  { tier: 'AMBER',    pct: 30, color: 'bg-amber-500',   text: 'text-amber-300',   border: 'border-amber-500/30',   count: 135 },
  { tier: 'RED',      pct: 18, color: 'bg-red-500',     text: 'text-red-300',     border: 'border-red-500/30',     count: 81  },
  { tier: 'CRITICAL', pct: 7,  color: 'bg-red-700',     text: 'text-red-200',     border: 'border-red-700/30',     count: 32  },
];

const ROOT_CAUSES = [
  { label: 'Academic Difficulty',  count: 25, pct: 28, color: 'bg-indigo-500' },
  { label: 'Motivational',         count: 18, pct: 20, color: 'bg-violet-500' },
  { label: 'Financial Hardship',   count: 15, pct: 17, color: 'bg-amber-500' },
  { label: 'Multiple Factors',     count: 12, pct: 13, color: 'bg-orange-500' },
  { label: 'Social Isolation',     count: 10, pct: 11, color: 'bg-sky-500' },
  { label: 'Health-Related',       count: 8,  pct: 9,  color: 'bg-teal-500' },
  { label: 'Uncertain',            count: 2,  pct: 2,  color: 'bg-slate-500' },
];

const TREND_WEEKS = [
  { week: 'Wk 1', score: 0.45 },
  { week: 'Wk 2', score: 0.46 },
  { week: 'Wk 3', score: 0.48 },
  { week: 'Wk 4', score: 0.47 },
  { week: 'Wk 5', score: 0.49 },
  { week: 'Wk 6', score: 0.50 },
  { week: 'Wk 7', score: 0.51 },
  { week: 'Wk 8', score: 0.52 },
];

const NAV_ITEMS = [
  { label: 'Overview',    icon: LayoutDashboard, href: '/dashboard/admin',  active: true },
  { label: 'Departments', icon: Building2,       href: '#departments',       active: false },
  { label: 'Analytics',   icon: BarChart2,       href: '#root-causes',       active: false },
  { label: 'Reports',     icon: FileText,        href: '#',                  active: false },
];

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 text-slate-600" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-indigo-400" />
    : <ChevronDown className="w-3 h-3 text-indigo-400" />;
}

// ─── SVG Trend Line ───────────────────────────────────────────────────────────

function TrendChart() {
  const W = 640, H = 140, PAD = { top: 16, right: 24, bottom: 36, left: 48 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const minScore = 0.40, maxScore = 0.60;
  const xStep = innerW / (TREND_WEEKS.length - 1);
  const yScale = (s: number) => innerH - ((s - minScore) / (maxScore - minScore)) * innerH;

  const points = TREND_WEEKS.map((d, i) => ({
    x: PAD.left + i * xStep,
    y: PAD.top + yScale(d.score),
    ...d,
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = [
    `M ${points[0].x} ${PAD.top + innerH}`,
    ...points.map(p => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${PAD.top + innerH}`,
    'Z',
  ].join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minHeight: 120 }}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.42, 0.46, 0.50, 0.54, 0.58].map(v => {
        const y = PAD.top + yScale(v);
        if (y < PAD.top || y > PAD.top + innerH) return null;
        return (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} fontSize={9} fill="#64748b" textAnchor="end">{v.toFixed(2)}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#trendGrad)" />
      <polyline points={polyline} fill="none" stroke="#f97316" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#f97316" stroke="#0f172a" strokeWidth={2} />
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={H - 8} fontSize={10} fill="#64748b" textAnchor="middle">{p.week}</text>
      ))}
      <g>
        <line x1={points[0].x} y1={PAD.top + yScale(0.45)} x2={points[7].x} y2={PAD.top + yScale(0.52)} stroke="#f97316" strokeWidth={1} strokeDasharray="4 3" opacity={0.4} />
        <rect x={points[6].x - 4} y={PAD.top + yScale(0.52) - 18} width={68} height={16} rx={3} fill="#f97316" fillOpacity={0.15} />
        <text x={points[6].x - 1} y={PAD.top + yScale(0.52) - 6} fontSize={9} fill="#fb923c" textAnchor="start">↑ +15.5% trend</text>
      </g>
    </svg>
  );
}

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────

function DonutChart() {
  const R = 70, cx = 100, cy = 90, strokeW = 28;
  const circumference = 2 * Math.PI * R;
  let offset = 0;
  const slices = RISK_DISTRIBUTION.map(d => {
    const dash = (d.pct / 100) * circumference;
    const gap = circumference - dash;
    const slice = { ...d, dashArray: `${dash} ${gap}`, dashOffset: -offset };
    offset += dash;
    return slice;
  });
  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#991b1b'];
  return (
    <svg viewBox="0 0 200 180" className="w-full max-w-[200px] mx-auto">
      {slices.map((s, i) => (
        <circle
          key={s.tier} cx={cx} cy={cy} r={R}
          fill="none" stroke={COLORS[i]} strokeWidth={strokeW}
          strokeDasharray={s.dashArray} strokeDashoffset={s.dashOffset}
          strokeLinecap="butt" transform={`rotate(-90 ${cx} ${cy})`} opacity={0.9}
        />
      ))}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={22} fontWeight="800" fill="white">450</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="#94a3b8">students</text>
    </svg>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent: string;
}) {
  return (
    <div className={`glass-panel rounded-2xl p-5 border ${accent} flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className="opacity-60">{icon}</span>
      </div>
      <div className="text-4xl font-extrabold text-white tabular-nums">{value}</div>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedDepts = useMemo(() => {
    return [...DEPARTMENTS].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      if (typeof av === 'number' && typeof bv === 'number')
        return sortDir === 'asc' ? av - bv : bv - av;
      return 0;
    });
  }, [sortKey, sortDir]);

  const totalStudents = DEPARTMENTS.reduce((s, d) => s + d.students, 0);
  const studentsRequiringSupport = Math.round(totalStudents * 0.16);
  const totalInterventions = DEPARTMENTS.reduce((s, d) => s + d.activeInterventions, 0);

  const COL_HEADERS: { key: SortKey; label: string; right?: boolean }[] = [
    { key: 'name',                label: 'Department' },
    { key: 'students',            label: 'Students',       right: true },
    { key: 'avgAttendance',       label: 'Avg Attendance',  right: true },
    { key: 'avgScore',            label: 'Avg Score',       right: true },
    { key: 'pctRequiringSupport', label: '% Support Req.',  right: true },
    { key: 'activeInterventions', label: 'Active Ivtns.',   right: true },
    { key: 'completionRate',      label: 'Completion',      right: true },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 glass-panel">
        <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white text-sm">ESS — Admin Dashboard</span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border text-indigo-400 bg-indigo-500/10 border-indigo-500/30">admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 hidden sm:block">admin@college.edu</span>
            <button id="admin-logout-btn" onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        {/* Sidebar */}
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
            <p className="text-xs text-slate-600 px-3 mt-0.5">No PII in reports</p>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 md:p-8 space-y-10 overflow-x-hidden">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
            <p className="text-slate-400 text-sm mt-1">College-level aggregated metrics · No individual student PII</p>
          </div>

          {/* TOP METRICS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Students" value={totalStudents} sub="Across 8 departments"
              icon={<Users className="w-5 h-5 text-indigo-400" />} accent="border-indigo-500/20" />
            <MetricCard label="Departments" value={8} sub="Active academic units"
              icon={<Building2 className="w-5 h-5 text-sky-400" />} accent="border-sky-500/20" />
            <MetricCard label="Requiring Support" value={studentsRequiringSupport} sub="16% of total enrolment"
              icon={<AlertTriangle className="w-5 h-5 text-amber-400" />} accent="border-amber-500/20" />
            <MetricCard label="Active Interventions" value={totalInterventions} sub="In progress or pending"
              icon={<Activity className="w-5 h-5 text-emerald-400" />} accent="border-emerald-500/20" />
          </div>

          {/* DEPARTMENT TABLE */}
          <section id="departments">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Department Comparison</h2>
              <div className="flex-1 h-px bg-white/5 ml-2" />
              <span className="text-xs text-slate-500">Click header to sort · Click row to drill down</span>
            </div>
            <div className="glass-panel rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="border-b border-white/8">
                    {COL_HEADERS.map(col => (
                      <th key={col.key} onClick={() => handleSort(col.key)}
                        className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-400 cursor-pointer select-none hover:text-white transition-colors ${col.right ? 'text-right' : 'text-left'}`}>
                        <span className={`inline-flex items-center gap-1 ${col.right ? 'justify-end w-full' : ''}`}>
                          {col.label}
                          <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDepts.map((dept, idx) => {
                    const supportBadge = dept.pctRequiringSupport >= 20 ? 'text-red-400 bg-red-500/10' : dept.pctRequiringSupport >= 15 ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10';
                    const attendColor  = dept.avgAttendance < 72 ? 'text-red-400' : dept.avgAttendance < 78 ? 'text-amber-400' : 'text-emerald-400';
                    return (
                      <tr key={dept.id} onClick={() => router.push(`/dashboard/admin/department/${dept.id}`)}
                        className={`border-b border-white/5 last:border-0 cursor-pointer transition-colors hover:bg-indigo-500/5 group ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                        <td className="px-4 py-3.5 font-medium text-white group-hover:text-indigo-300 transition-colors">
                          <span className="flex items-center gap-2">{dept.name}<ArrowUpRight className="w-3 h-3 text-slate-600 group-hover:text-indigo-400 shrink-0" /></span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-300 tabular-nums">{dept.students}</td>
                        <td className={`px-4 py-3.5 text-right font-medium tabular-nums ${attendColor}`}>{dept.avgAttendance}%</td>
                        <td className="px-4 py-3.5 text-right text-slate-300 tabular-nums">{dept.avgScore}%</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold tabular-nums ${supportBadge}`}>{dept.pctRequiringSupport}%</span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-300 tabular-nums">{dept.activeInterventions}</td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div className={`h-full rounded-full ${dept.completionRate >= 75 ? 'bg-emerald-500' : dept.completionRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${dept.completionRate}%` }} />
                            </div>
                            <span className="text-slate-400 text-xs tabular-nums w-8 text-right">{dept.completionRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-xs text-indigo-400 font-medium group-hover:underline">View →</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* RISK + ROOT CAUSE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="root-causes">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Risk Tier Distribution</h2>
                <div className="flex-1 h-px bg-white/5 ml-2" />
              </div>
              <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-center gap-6">
                  <div className="shrink-0 w-[180px]"><DonutChart /></div>
                  <div className="flex-1 space-y-3">
                    {RISK_DISTRIBUTION.map(d => (
                      <div key={d.tier} className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${d.color}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className={`font-semibold ${d.text}`}>{d.tier}</span>
                            <span className="text-slate-400 tabular-nums">{d.count} · {d.pct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.pct}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Root Cause Distribution</h2>
                <span className="text-xs text-slate-500 ml-1">Last 30 days</span>
                <div className="flex-1 h-px bg-white/5 ml-2" />
              </div>
              <div className="glass-panel rounded-2xl p-6 space-y-3.5">
                {ROOT_CAUSES.map(rc => (
                  <div key={rc.label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-40 shrink-0">{rc.label}</span>
                    <div className="flex-1 h-5 bg-white/5 rounded-md overflow-hidden relative">
                      <div className={`h-full rounded-md ${rc.color} opacity-80`} style={{ width: `${rc.pct * 3.57}%` }} />
                      <span className="absolute inset-0 flex items-center pl-2 text-xs font-medium text-white/80">{rc.count} cases</span>
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{rc.pct}%</span>
                  </div>
                ))}
                <p className="text-xs text-slate-600 pt-2 border-t border-white/5">Aggregated · No individual identification</p>
              </div>
            </section>
          </div>

          {/* TREND CHART */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <h2 className="text-base font-bold text-white">College Risk Score Trend</h2>
              <span className="text-xs text-slate-500 ml-1">Last 8 weeks</span>
              <div className="flex-1 h-px bg-white/5 ml-2" />
              <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3" />Trending ↑ — Review advised
              </span>
            </div>
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                <p className="text-xs text-slate-500">Average college-wide risk score (0.00–1.00) · No individual data shown</p>
              </div>
              <TrendChart />
              <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                <span>Wk 1: 0.45</span>
                <span className="text-orange-400 font-medium">Wk 8: 0.52 (+15.5% from baseline)</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
