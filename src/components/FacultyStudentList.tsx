'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Minus,
  ChevronDown, Filter, ArrowUpDown,
  User, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tier = 'GREEN' | 'AMBER' | 'RED' | 'CRITICAL';
type Trajectory = 'improving' | 'stable' | 'deteriorating';

interface RiskAssessment {
  risk_score: number;
  tier: Tier;
  trajectory: Trajectory;
  created_at: string;
}

interface RootCause {
  primary_cause: string;
  confidence: number;
  created_at: string;
}

interface Intervention {
  status: string;
  created_at: string;
}

interface Department {
  name: string;
}

interface Student {
  id: number;
  name: string;
  year: number;
  department_id: number | null;
  departments: Department | Department[] | null;
  risk_assessments: RiskAssessment | RiskAssessment[] | null;
  root_cause_assessments: RootCause | RootCause[] | null;
  interventions: Intervention | Intervention[] | null;
}

interface DepartmentOption {
  id: number;
  name: string;
}

interface Props {
  students: Student[];
  departments: DepartmentOption[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Supabase returns either an object or array for joined tables — normalise */
function first<T>(val: T | T[] | null): T | null {
  if (!val) return null;
  return Array.isArray(val) ? (val[0] ?? null) : val;
}

function latest<T extends { created_at: string }>(val: T | T[] | null): T | null {
  if (!val) return null;
  if (!Array.isArray(val)) return val;
  return [...val].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0] ?? null;
}

const TIER_ORDER: Record<Tier, number> = { GREEN: 0, AMBER: 1, RED: 2, CRITICAL: 3 };

const TIER_STYLES: Record<Tier, { badge: string; bar: string; dot: string }> = {
  GREEN: {
    badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-400',
  },
  AMBER: {
    badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    bar: 'bg-amber-500',
    dot: 'bg-amber-400',
  },
  RED: {
    badge: 'bg-red-500/15 text-red-400 border border-red-500/30',
    bar: 'bg-red-500',
    dot: 'bg-red-400',
  },
  CRITICAL: {
    badge: 'bg-red-700/25 text-red-300 border border-red-600/40',
    bar: 'bg-red-600',
    dot: 'bg-red-300',
  },
};

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  in_progress: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  assigned: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  recommended: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
};

function TrajectoryIcon({ trajectory }: { trajectory: Trajectory | null }) {
  if (!trajectory) return <Minus className="w-4 h-4 text-slate-500" />;
  if (trajectory === 'improving')
    return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (trajectory === 'deteriorating')
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
}

function trajectoryLabel(t: Trajectory | null) {
  if (!t) return '\u2014';
  return t === 'improving' ? '\u2191 Improving' : t === 'deteriorating' ? '\u2193 Deteriorating' : '\u2192 Stable';
}

function trajectoryColor(t: Trajectory | null) {
  if (t === 'improving') return 'text-emerald-400';
  if (t === 'deteriorating') return 'text-red-400';
  return 'text-slate-400';
}

function interventionStatusLabel(s: string | null) {
  if (!s) return 'No Action';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Synthetic fallback data ──────────────────────────────────────────────────

const SYNTHETIC_STUDENTS: Student[] = [
  { id: 1,  name: 'Aryan Mehta',       year: 2, department_id: 1, departments: { name: 'Computer Science' }, risk_assessments: { risk_score: 0.87, tier: 'CRITICAL', trajectory: 'deteriorating', created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Attendance: 48% ↓', confidence: 91, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'in_progress', created_at: '2026-09-01T00:00:00Z' } },
  { id: 2,  name: 'Priya Nair',         year: 3, department_id: 2, departments: { name: 'Electronics' },      risk_assessments: { risk_score: 0.79, tier: 'RED',      trajectory: 'deteriorating', created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'GPA Drop: 7.2 → 5.1', confidence: 85, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'assigned', created_at: '2026-09-01T00:00:00Z' } },
  { id: 3,  name: 'Rohit Kumar',        year: 1, department_id: 1, departments: { name: 'Computer Science' }, risk_assessments: { risk_score: 0.72, tier: 'RED',      trajectory: 'stable',        created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'LMS Logins: 2/week ↓', confidence: 78, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'pending', created_at: '2026-09-01T00:00:00Z' } },
  { id: 4,  name: 'Sneha Pillai',       year: 4, department_id: 3, departments: { name: 'Mechanical' },       risk_assessments: { risk_score: 0.65, tier: 'AMBER',    trajectory: 'deteriorating', created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Assignments: 40% submitted', confidence: 70, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'recommended', created_at: '2026-09-01T00:00:00Z' } },
  { id: 5,  name: 'Kiran Rao',          year: 2, department_id: 2, departments: { name: 'Electronics' },      risk_assessments: { risk_score: 0.61, tier: 'AMBER',    trajectory: 'stable',        created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Attendance: 64% ↓', confidence: 67, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'in_progress', created_at: '2026-09-01T00:00:00Z' } },
  { id: 6,  name: 'Lakshmi Menon',      year: 3, department_id: 4, departments: { name: 'Civil' },            risk_assessments: { risk_score: 0.58, tier: 'AMBER',    trajectory: 'improving',     created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Financial Stress (self-reported)', confidence: 60, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'completed', created_at: '2026-09-01T00:00:00Z' } },
  { id: 7,  name: 'Dinesh Sharma',      year: 1, department_id: 1, departments: { name: 'Computer Science' }, risk_assessments: { risk_score: 0.55, tier: 'AMBER',    trajectory: 'stable',        created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Score: 52/100 in Maths', confidence: 63, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'pending', created_at: '2026-09-01T00:00:00Z' } },
  { id: 8,  name: 'Anjali Gupta',       year: 2, department_id: 3, departments: { name: 'Mechanical' },       risk_assessments: { risk_score: 0.82, tier: 'CRITICAL', trajectory: 'deteriorating', created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Attendance: 38% ↓', confidence: 88, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'assigned', created_at: '2026-09-01T00:00:00Z' } },
  { id: 9,  name: 'Suresh Balan',       year: 4, department_id: 2, departments: { name: 'Electronics' },      risk_assessments: { risk_score: 0.48, tier: 'AMBER',    trajectory: 'improving',     created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'LMS: 30% assignment submission', confidence: 55, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'completed', created_at: '2026-09-01T00:00:00Z' } },
  { id: 10, name: 'Kavya Reddy',        year: 1, department_id: 4, departments: { name: 'Civil' },            risk_assessments: { risk_score: 0.74, tier: 'RED',      trajectory: 'deteriorating', created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'GPA: 4.9 CGPA ↓', confidence: 80, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'in_progress', created_at: '2026-09-01T00:00:00Z' } },
  { id: 11, name: 'Vikram Singh',       year: 3, department_id: 1, departments: { name: 'Computer Science' }, risk_assessments: { risk_score: 0.29, tier: 'GREEN',    trajectory: 'stable',        created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Minor drop in LMS activity', confidence: 35, created_at: '2026-09-01T00:00:00Z' }, interventions: null },
  { id: 12, name: 'Meena Krishnan',     year: 2, department_id: 3, departments: { name: 'Mechanical' },       risk_assessments: { risk_score: 0.67, tier: 'RED',      trajectory: 'stable',        created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Attendance: 59% ↓', confidence: 72, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'recommended', created_at: '2026-09-01T00:00:00Z' } },
  { id: 13, name: 'Rajan Iyer',         year: 4, department_id: 2, departments: { name: 'Electronics' },      risk_assessments: { risk_score: 0.43, tier: 'AMBER',    trajectory: 'improving',     created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Peer conflict (reported)', confidence: 50, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'completed', created_at: '2026-09-01T00:00:00Z' } },
  { id: 14, name: 'Pooja Desai',        year: 1, department_id: 1, departments: { name: 'Computer Science' }, risk_assessments: { risk_score: 0.90, tier: 'CRITICAL', trajectory: 'deteriorating', created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Attendance: 22% — urgent', confidence: 95, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'in_progress', created_at: '2026-09-01T00:00:00Z' } },
  { id: 15, name: 'Amit Joshi',         year: 2, department_id: 4, departments: { name: 'Civil' },            risk_assessments: { risk_score: 0.38, tier: 'AMBER',    trajectory: 'stable',        created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Score: 55/100 avg ↓', confidence: 45, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'pending', created_at: '2026-09-01T00:00:00Z' } },
  { id: 16, name: 'Nithya Balaji',      year: 3, department_id: 2, departments: { name: 'Electronics' },      risk_assessments: { risk_score: 0.25, tier: 'GREEN',    trajectory: 'improving',     created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Recovered after counseling', confidence: 30, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'completed', created_at: '2026-09-01T00:00:00Z' } },
  { id: 17, name: 'Harish Anand',       year: 1, department_id: 3, departments: { name: 'Mechanical' },       risk_assessments: { risk_score: 0.77, tier: 'RED',      trajectory: 'deteriorating', created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Assignments: 30% submitted ↓', confidence: 82, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'assigned', created_at: '2026-09-01T00:00:00Z' } },
  { id: 18, name: 'Swetha Raj',         year: 4, department_id: 1, departments: { name: 'Computer Science' }, risk_assessments: { risk_score: 0.54, tier: 'AMBER',    trajectory: 'stable',        created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'LMS: 1 login/week avg', confidence: 60, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'pending', created_at: '2026-09-01T00:00:00Z' } },
  { id: 19, name: 'Ganesh Muthukumar',  year: 2, department_id: 4, departments: { name: 'Civil' },            risk_assessments: { risk_score: 0.83, tier: 'CRITICAL', trajectory: 'deteriorating', created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Mental health concern flagged', confidence: 89, created_at: '2026-09-01T00:00:00Z' }, interventions: { status: 'in_progress', created_at: '2026-09-01T00:00:00Z' } },
  { id: 20, name: 'Lavanya Suresh',     year: 3, department_id: 3, departments: { name: 'Mechanical' },       risk_assessments: { risk_score: 0.31, tier: 'GREEN',    trajectory: 'improving',     created_at: '2026-09-01T00:00:00Z' }, root_cause_assessments: { primary_cause: 'Mild attendance dip — monitoring', confidence: 38, created_at: '2026-09-01T00:00:00Z' }, interventions: null },
];

const SYNTHETIC_DEPARTMENTS: DepartmentOption[] = [
  { id: 1, name: 'Computer Science' },
  { id: 2, name: 'Electronics' },
  { id: 3, name: 'Mechanical' },
  { id: 4, name: 'Civil' },
];

// ─── Summary stat card ────────────────────────────────────────────────────────

function StatCard({ label, value, colorClass, icon }: { label: string; value: number; colorClass: string; icon: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col gap-2">
      <div className={`flex items-center justify-between ${colorClass}`}>
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
        {icon}
      </div>
      <span className="text-3xl font-extrabold text-white">{value}</span>
    </div>
  );
}

// ─── Student Card ─────────────────────────────────────────────────────────────

function StudentCard({ student }: { student: Student }) {
  const risk = latest(student.risk_assessments);
  const cause = latest(student.root_cause_assessments);
  const intervention = latest(student.interventions);
  const dept = first(student.departments);

  const tier: Tier = risk?.tier ?? 'GREEN';
  const score = risk?.risk_score ?? 0;
  const trajectory: Trajectory | null = risk?.trajectory ?? null;
  const tierStyles = TIER_STYLES[tier];

  const intStatus = intervention?.status ?? null;
  const intStatusStyle = intStatus ? (STATUS_STYLES[intStatus] ?? STATUS_STYLES.recommended) : null;

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 hover:border-white/20 hover:shadow-lg hover:shadow-black/30 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${tierStyles.dot}`} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate group-hover:text-slate-100">{student.name}</div>
            <div className="text-xs text-slate-500">
              ID #{student.id} &middot; Year {student.year} &middot; {dept?.name ?? 'N/A'}
            </div>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${tierStyles.badge}`}>
          {tier}
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500 font-medium">Risk Score</span>
          <span className="text-xs font-bold text-white tabular-nums">{Math.round(score * 100)}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${tierStyles.bar}`}
            style={{ width: `${Math.round(score * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <TrajectoryIcon trajectory={trajectory} />
          <span className={`text-xs font-medium ${trajectoryColor(trajectory)}`}>
            {trajectoryLabel(trajectory)}
          </span>
        </div>
        {cause?.primary_cause && (
          <span className="text-xs text-slate-400 truncate max-w-[160px] text-right" title={cause.primary_cause}>
            {cause.primary_cause}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
        {intStatus ? (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${intStatusStyle}`}>
            {interventionStatusLabel(intStatus)}
          </span>
        ) : (
          <span className="text-xs text-slate-600 italic">No action yet</span>
        )}
        <Link
          href={`/student/${student.id}`}
          id={`view-profile-${student.id}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:border-indigo-400/40 hover:bg-indigo-500/5 transition-all"
        >
          <User className="w-3.5 h-3.5" />
          View Profile
        </Link>
      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

type SortKey = 'risk_score' | 'tier' | 'trajectory';

export default function FacultyStudentList({ students, departments }: Props) {
  const allStudents = students.length > 0 ? students : SYNTHETIC_STUDENTS;
  const allDepts = departments.length > 0 ? departments : SYNTHETIC_DEPARTMENTS;

  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('risk_score');

  const filtered = useMemo(() => {
    let list = allStudents;

    if (deptFilter !== 'all') {
      list = list.filter((s) => {
        const dept = first(s.departments);
        return dept?.name === deptFilter;
      });
    }

    if (tierFilter !== 'all') {
      list = list.filter((s) => {
        const risk = latest(s.risk_assessments);
        return risk?.tier === tierFilter;
      });
    }

    list = [...list].sort((a, b) => {
      const ra = latest(a.risk_assessments);
      const rb = latest(b.risk_assessments);
      if (sortKey === 'risk_score') {
        return (rb?.risk_score ?? 0) - (ra?.risk_score ?? 0);
      }
      if (sortKey === 'tier') {
        return (TIER_ORDER[rb?.tier as Tier] ?? 0) - (TIER_ORDER[ra?.tier as Tier] ?? 0);
      }
      if (sortKey === 'trajectory') {
        const ORDER = { deteriorating: 2, stable: 1, improving: 0 };
        return (ORDER[rb?.trajectory as Trajectory] ?? 0) - (ORDER[ra?.trajectory as Trajectory] ?? 0);
      }
      return 0;
    });

    return list;
  }, [allStudents, deptFilter, tierFilter, sortKey]);

  const counts = useMemo(() => {
    const critical = allStudents.filter(s => latest(s.risk_assessments)?.tier === 'CRITICAL').length;
    const red      = allStudents.filter(s => latest(s.risk_assessments)?.tier === 'RED').length;
    const amber    = allStudents.filter(s => latest(s.risk_assessments)?.tier === 'AMBER').length;
    const needsAttn = allStudents.filter(s => {
      const iv = latest(s.interventions);
      return !iv || iv.status === 'recommended' || iv.status === 'pending';
    }).length;
    return { critical, red, amber, needsAttn };
  }, [allStudents]);

  const selectClass =
    'appearance-none bg-slate-800/70 border border-white/10 text-slate-200 text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer hover:border-white/20 transition-colors';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Students"   value={allStudents.length}  colorClass="text-indigo-400"  icon={<User className="w-4 h-4" />} />
        <StatCard label="Critical"         value={counts.critical}     colorClass="text-red-300"     icon={<AlertTriangle className="w-4 h-4" />} />
        <StatCard label="At Risk (RED)"    value={counts.red}          colorClass="text-red-400"     icon={<TrendingDown className="w-4 h-4" />} />
        <StatCard label="Needs Attention"  value={counts.needsAttn}    colorClass="text-amber-400"   icon={<Clock className="w-4 h-4" />} />
      </div>

      <div className="glass-panel rounded-2xl px-5 py-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-500 shrink-0" />

        <div className="relative">
          <select
            id="filter-department"
            className={selectClass}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {allDepts.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            id="filter-tier"
            className={selectClass}
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
          >
            <option value="all">All Tiers</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="RED">🟠 Red</option>
            <option value="AMBER">🟡 Amber</option>
            <option value="GREEN">🟢 Green</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            id="sort-by"
            className={selectClass}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="risk_score">Sort: Risk Score</option>
            <option value="tier">Sort: Tier</option>
            <option value="trajectory">Sort: Trajectory</option>
          </select>
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <span className="ml-auto text-xs text-slate-500 shrink-0">
          {filtered.length} of {allStudents.length} students
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No students match the current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  );
}
