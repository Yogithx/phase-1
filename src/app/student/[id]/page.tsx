import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase-server';
import AssignInterventionModal from '@/components/AssignInterventionModal';
import { calculateRiskScore } from '@/lib/riskEngine';
import {
  ArrowLeft, User, BookOpen, TrendingUp, TrendingDown,
  Minus, AlertTriangle, Activity, Calendar, CheckCircle2,
  Clock, Brain, Lightbulb, FileText, BarChart2, ShieldAlert,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type RiskTier = 'GREEN' | 'AMBER' | 'RED' | 'CRITICAL';
type RiskTrajectory = 'improving' | 'stable' | 'deteriorating';

// ─── Colour maps ───────────────────────────────────────────────────────────────

const TIER_BADGE: Record<RiskTier, string> = {
  GREEN:    'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  AMBER:    'bg-amber-500/15  text-amber-300  border border-amber-500/30',
  RED:      'bg-red-500/15    text-red-300    border border-red-500/30',
  CRITICAL: 'bg-red-700/25   text-red-200    border border-red-600/40',
};

const TIER_BAR: Record<RiskTier, string> = {
  GREEN: 'bg-emerald-500', AMBER: 'bg-amber-500', RED: 'bg-red-500', CRITICAL: 'bg-red-600',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function avg(nums: number[]) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function pct(n: number) { return `${Math.round(n)}%`; }

function trendIcon(diff: number | null, size = 'w-4 h-4') {
  if (diff === null) return <Minus className={`${size} text-slate-500`} />;
  if (diff < -2)   return <TrendingDown className={`${size} text-red-400`} />;
  if (diff > 2)    return <TrendingUp className={`${size} text-emerald-400`} />;
  return <Minus className={`${size} text-slate-400`} />;
}

function trendColor(diff: number | null) {
  if (diff === null) return 'text-slate-400';
  if (diff < -2) return 'text-red-400';
  if (diff > 2)  return 'text-emerald-400';
  return 'text-slate-400';
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({
  label, value, unit = '', prevValue, prevLabel, icon, alert,
}: {
  label: string; value: string | number | null; unit?: string;
  prevValue?: string | number | null; prevLabel?: string;
  icon: React.ReactNode; alert?: boolean;
}) {
  const diff = (typeof value === 'number' && typeof prevValue === 'number')
    ? value - prevValue : null;

  return (
    <div className={`glass-panel rounded-2xl p-5 flex flex-col gap-3 ${alert ? 'border-red-500/25' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className={alert ? 'text-red-400' : 'text-slate-500'}>{icon}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-extrabold ${alert ? 'text-red-300' : 'text-white'}`}>
          {value ?? '—'}{value !== null ? unit : ''}
        </span>
        {diff !== null && (
          <span className={`text-sm font-semibold mb-0.5 flex items-center gap-0.5 ${trendColor(diff)}`}>
            {trendIcon(diff, 'w-3.5 h-3.5')}
            {diff > 0 ? '+' : ''}{Math.round(diff)}{unit}
          </span>
        )}
      </div>
      {prevValue !== null && prevValue !== undefined && (
        <p className="text-xs text-slate-500">
          {prevLabel ?? 'Prev period'}: <span className="text-slate-400">{prevValue}{unit}</span>
        </p>
      )}
      {value === null && (
        <p className="text-xs text-slate-600 italic">Data unavailable for this metric</p>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-indigo-400">{icon}</span>
        <h2 className="text-base font-bold text-white">{title}</h2>
        <div className="flex-1 h-px bg-white/5 ml-2" />
      </div>
      {children}
    </div>
  );
}

// ─── Trajectory display ───────────────────────────────────────────────────────

function TrajectoryBadge({ trajectory }: { trajectory: RiskTrajectory }) {
  const cfg = {
    improving:    { icon: <TrendingUp className="w-4 h-4" />,    cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30', label: '↑ Improving' },
    stable:       { icon: <Minus className="w-4 h-4" />,          cls: 'text-slate-300   bg-slate-500/10   border-slate-500/30',   label: '→ Stable' },
    deteriorating:{ icon: <TrendingDown className="w-4 h-4" />,  cls: 'text-red-300    bg-red-500/10    border-red-500/30',     label: '↓ Deteriorating' },
  }[trajectory];

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${cfg.cls}`}>
      {cfg.icon}
      <span className="font-bold text-sm">{cfg.label}</span>
    </div>
  );
}

// ─── Intervention history row ─────────────────────────────────────────────────

function InterventionRow({ iv }: { iv: {
  id: number; type: string; status: string;
  due_date: string | null; outcome: string | null; created_at: string;
}}) {
  const STATUS: Record<string, string> = {
    completed:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    in_progress: 'bg-indigo-500/10  text-indigo-400  border-indigo-500/20',
    assigned:    'bg-sky-500/10     text-sky-400     border-sky-500/20',
    pending:     'bg-amber-500/10   text-amber-400   border-amber-500/20',
    recommended: 'bg-slate-700      text-slate-300   border-slate-600',
  };
  const s = STATUS[iv.status] ?? STATUS.recommended;
  return (
    <div className="flex flex-wrap items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{iv.type}</div>
        <div className="text-xs text-slate-500 mt-0.5">
          Assigned: {new Date(iv.created_at).toLocaleDateString()}
          {iv.due_date && ` · Due: ${iv.due_date}`}
        </div>
        {iv.outcome && (
          <div className="text-xs text-slate-400 mt-1">Outcome: {iv.outcome}</div>
        )}
      </div>
      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${s} whitespace-nowrap`}>
        {iv.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
      </span>
    </div>
  );
}

// ─── Synthetic demo data ──────────────────────────────────────────────────────

const SYNTH: Record<string, {
  student: { name: string; email: string; year: number; dept: string; enrollment_date: string };
  risk: { risk_score: number; tier: RiskTier; trajectory: RiskTrajectory };
  rootCause: {
    primary_cause: string; confidence: number;
    factors: string[]; alt_causes: { cause: string; confidence: number; reason: string }[];
    explanation: string; recommendation: string; rec_confidence: number;
  };
  metrics: { attendNow: number; attendPrev: number; gpaNow: number; gpaPrev: number; lmsNow: number; lmsPrev: number; assNow: number; assPrev: number; assTotal: number; };
  interventions: { id: number; type: string; status: string; due_date: string | null; outcome: string | null; created_at: string }[];
}> = {
  '1': {
    student: { name: 'Aryan Mehta', email: 'aryan.mehta@college.edu', year: 2, dept: 'Computer Science', enrollment_date: '2024-08-01' },
    risk: { risk_score: 0.87, tier: 'CRITICAL', trajectory: 'deteriorating' },
    rootCause: {
      primary_cause: 'Academic Difficulty', confidence: 88,
      factors: [
        'Attendance declined 82% → 48% over 4 weeks (↓34%)',
        'Quiz scores dropped: 78% average → 52% (↓26%)',
        'LMS time-on-task: INCREASED (studying more but performing worse)',
        'This pattern suggests content difficulty, not disengagement',
      ],
      alt_causes: [
        { cause: 'Financial hardship', confidence: 8, reason: 'No fee payment delays detected' },
        { cause: 'Health issues', confidence: 4, reason: 'LMS logins still present — not fully withdrawn' },
      ],
      explanation: 'Over the past 4 weeks, this student\'s attendance dropped significantly and academic performance declined sharply. Quiz scores dropped despite an increase in time spent on the LMS, which suggests the student is struggling with course content rather than avoiding classes. Financial and health issues appear unlikely based on available signals.',
      recommendation: 'Academic Tutoring + Peer Mentoring',
      rec_confidence: 88,
    },
    metrics: { attendNow: 48, attendPrev: 82, gpaNow: 52, gpaPrev: 78, lmsNow: 3, lmsPrev: 9, assNow: 2, assPrev: 5, assTotal: 5 },
    interventions: [
      { id: 1, type: 'Academic Tutoring', status: 'in_progress', due_date: '2026-10-15', outcome: null, created_at: '2026-09-10T00:00:00Z' },
    ],
  },
  default: {
    student: { name: 'Student', email: 'student@college.edu', year: 1, dept: 'Engineering', enrollment_date: '2025-08-01' },
    risk: { risk_score: 0.55, tier: 'AMBER', trajectory: 'stable' },
    rootCause: {
      primary_cause: 'Low Engagement', confidence: 65,
      factors: [
        'LMS logins dropped from 7/week to 2/week (↓71%)',
        'Assignment submission rate: 60% (below 80% threshold)',
        'Attendance stable at 70% — not the primary driver',
      ],
      alt_causes: [
        { cause: 'Academic difficulty', confidence: 20, reason: 'Scores within passing range' },
        { cause: 'Personal stress', confidence: 15, reason: 'No counseling flags raised yet' },
      ],
      explanation: 'This student shows moderate risk primarily due to declining LMS engagement. Attendance remains acceptable but assignment submissions have dropped. This pattern is consistent with motivational or adjustment difficulties rather than academic inability.',
      recommendation: 'Counselor Check-In',
      rec_confidence: 65,
    },
    metrics: { attendNow: 70, attendPrev: 76, gpaNow: 62, gpaPrev: 67, lmsNow: 2, lmsPrev: 7, assNow: 3, assPrev: 5, assTotal: 5 },
    interventions: [],
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  // ── Fetch student
  const { data: studentRaw } = await supabase
    .from('students')
    .select('id, name, email, year, enrollment_date, departments(name)')
    .eq('id', id)
    .single();

  // ── Attendance (last 8 weeks)
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const { data: attendance } = await supabase
    .from('attendance')
    .select('date, status')
    .eq('student_id', id)
    .gte('date', eightWeeksAgo.toISOString().slice(0, 10))
    .order('date', { ascending: true });

  // ── Academics (last 4 weeks)
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const { data: academics } = await supabase
    .from('academic_records')
    .select('date, score, course')
    .eq('student_id', id)
    .gte('date', fourWeeksAgo.toISOString().slice(0, 10))
    .order('date', { ascending: true });

  // ── Engagement (last 4 weeks)
  const { data: engagement } = await supabase
    .from('engagement')
    .select('date, lms_logins, assignments_submitted, time_on_task')
    .eq('student_id', id)
    .gte('date', fourWeeksAgo.toISOString().slice(0, 10))
    .order('date', { ascending: true });

  // ── Risk
  const { data: riskRows } = await supabase
    .from('risk_assessments')
    .select('risk_score, tier, trajectory, created_at')
    .eq('student_id', id)
    .order('created_at', { ascending: false })
    .limit(1);

  // ── Root cause
  const { data: rcRows } = await supabase
    .from('root_cause_assessments')
    .select('primary_cause, confidence, factors, created_at')
    .eq('student_id', id)
    .order('created_at', { ascending: false })
    .limit(1);

  // ── Interventions
  const { data: interventions } = await supabase
    .from('interventions')
    .select('id, type, status, due_date, outcome, created_at')
    .eq('student_id', id)
    .order('created_at', { ascending: false });

  // ── Resolve demo data if DB empty
  const synth = SYNTH[id] ?? SYNTH.default;
  const useDemo = !studentRaw;

  if (!studentRaw && !useDemo) notFound();

  const student = studentRaw
    ? {
        name: studentRaw.name,
        email: studentRaw.email,
        year: studentRaw.year,
        dept: (studentRaw.departments as unknown as { name: string } | null)?.name ?? 'N/A',
        enrollment_date: studentRaw.enrollment_date,
      }
    : synth.student;

  // ── Compute metrics from DB data or synthetic
  let attendNow: number | null = null;
  let attendPrev: number | null = null;

  if (attendance && attendance.length > 0) {
    const half = Math.floor(attendance.length / 2);
    const recent = attendance.slice(half);
    const prev   = attendance.slice(0, half);
    const rate = (arr: typeof attendance) =>
      arr.length ? Math.round((arr.filter(r => r.status !== 'absent').length / arr.length) * 100) : null;
    attendNow  = rate(recent);
    attendPrev = rate(prev);
  } else {
    attendNow  = synth.metrics.attendNow;
    attendPrev = synth.metrics.attendPrev;
  }

  let gpaNow: number | null = null;
  let gpaPrev: number | null = null;

  if (academics && academics.length > 0) {
    const half = Math.floor(academics.length / 2);
    const avgVal = (arr: typeof academics) => arr.length ? Math.round(avg(arr.map(r => r.score))!) : null;
    gpaNow  = avgVal(academics.slice(half));
    gpaPrev = avgVal(academics.slice(0, half));
  } else {
    gpaNow  = synth.metrics.gpaNow;
    gpaPrev = synth.metrics.gpaPrev;
  }

  let lmsNow: number | null = null;
  let lmsPrev: number | null = null;
  let assNow: number | null = null;
  let assPrev: number | null = null;
  const assTotal = synth.metrics.assTotal;

  if (engagement && engagement.length > 0) {
    const half = Math.floor(engagement.length / 2);
    const recent = engagement.slice(half);
    const prev   = engagement.slice(0, half);
    lmsNow  = recent.length ? Math.round(avg(recent.map(r => r.lms_logins))!) : null;
    lmsPrev = prev.length  ? Math.round(avg(prev.map(r => r.lms_logins))!)   : null;
    assNow  = recent.length ? Math.round(avg(recent.map(r => r.assignments_submitted))!) : null;
    assPrev = prev.length  ? Math.round(avg(prev.map(r => r.assignments_submitted))!)   : null;
  } else {
    lmsNow  = synth.metrics.lmsNow;
    lmsPrev = synth.metrics.lmsPrev;
    assNow  = synth.metrics.assNow;
    assPrev = synth.metrics.assPrev;
  }

  // ── Multi-Factor Risk Assessment Engine Calculation
  const riskAssessment = calculateRiskScore({
    attendance: {
      currentRate: attendNow ?? undefined,
      previousRate: attendPrev ?? undefined,
    },
    academics: {
      currentScore: gpaNow ?? undefined,
      previousScore: gpaPrev ?? undefined,
    },
    engagement: {
      lmsLogins: lmsNow ?? undefined,
      previousLmsLogins: lmsPrev ?? undefined,
      assignmentsSubmitted: assNow ?? undefined,
      assignmentsTotal: assTotal,
    },
  });

  const risk = riskRows?.[0]
    ? {
        risk_score: riskRows[0].risk_score,
        tier: riskRows[0].tier as RiskTier,
        trajectory: riskRows[0].trajectory as RiskTrajectory,
        confidence: riskAssessment.confidence,
        contributingFactors: riskAssessment.contributingFactors,
      }
    : {
        risk_score: riskAssessment.score,
        tier: riskAssessment.tier,
        trajectory: riskAssessment.trajectory,
        confidence: riskAssessment.confidence,
        contributingFactors: riskAssessment.contributingFactors,
      };

  const rc = rcRows?.[0] ?? null;
  const rootCause = synth.rootCause; // always shown; DB overrides primary_cause + confidence if available

  if (rc) {
    rootCause.primary_cause = rc.primary_cause;
    rootCause.confidence = rc.confidence;
    if (rc.factors?.length) rootCause.factors = rc.factors;
  }

  const ivList = (interventions && interventions.length > 0) ? interventions : synth.interventions;

  // ── Alerts
  const attendAlert = attendNow !== null && attendNow < 70;
  const gpaAlert    = gpaNow    !== null && gpaPrev !== null && gpaNow < gpaPrev - 5;
  const lmsAlert    = lmsNow    !== null && lmsPrev !== null && lmsNow  < lmsPrev - 2;
  const assAlert    = assNow    !== null && assPrev !== null && assNow  < assPrev;

  const scoreBarWidth = Math.round((risk.risk_score ?? 0) * 100);

  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <div className="border-b border-white/8 bg-slate-950/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3">
          <Link
            href="/dashboard/faculty"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Faculty Dashboard
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-xs text-slate-400">Student Profile</span>
          <span className="text-slate-700">/</span>
          <span className="text-xs text-white font-semibold">{student.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-10">

        {/* ═══ SECTION 1: STUDENT INFO ═══════════════════════════════════════ */}
        <Section title="Student Information" icon={<User className="w-4 h-4" />}>
          <div className="glass-panel rounded-2xl px-6 py-5 flex flex-wrap gap-6 items-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                { label: 'ID',         value: `#${id}` },
                { label: 'Name',       value: student.name },
                { label: 'Department', value: student.dept },
                { label: 'Year',       value: `Year ${student.year}` },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-xs text-slate-500 mb-0.5">{f.label}</div>
                  <div className="font-semibold text-white">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══ SECTION 2: CURRENT INDICATORS ════════════════════════════════ */}
        <Section title="Current Indicators" icon={<Activity className="w-4 h-4" />}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Attendance" value={attendNow} unit="%" prevValue={attendPrev}
              prevLabel="Prev 4 weeks" icon={<Calendar className="w-4 h-4" />} alert={attendAlert}
            />
            <MetricCard
              label="Avg Score" value={gpaNow} unit="%" prevValue={gpaPrev}
              prevLabel="Prev period" icon={<BookOpen className="w-4 h-4" />} alert={gpaAlert}
            />
            <MetricCard
              label="LMS Logins / week" value={lmsNow} prevValue={lmsPrev}
              prevLabel="Prev period" icon={<BarChart2 className="w-4 h-4" />} alert={lmsAlert}
            />
            <MetricCard
              label={`Assignments (of ${assTotal})`} value={assNow} prevValue={assPrev}
              prevLabel="Prev period" icon={<CheckCircle2 className="w-4 h-4" />} alert={assAlert}
            />
          </div>
        </Section>

        {/* ═══ SECTION 3: SUPPORT ASSESSMENT ════════════════════════════════ */}
        <Section title="Support Assessment" icon={<AlertTriangle className="w-4 h-4" />}>
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Risk score */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Score</span>
                  <span className="text-xs text-indigo-400 font-medium">{risk.confidence}% confidence</span>
                </div>
                <div className="text-5xl font-extrabold text-white tabular-nums">
                  {pct(scoreBarWidth)}
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full ${TIER_BAR[risk.tier]}`} style={{ width: `${scoreBarWidth}%` }} />
                </div>
                <span className="text-xs text-slate-500">Risk Score: {risk.risk_score.toFixed(2)} / 1.00</span>
              </div>

              {/* Support tier */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Support Tier</span>
                <div className={`inline-flex px-5 py-3 rounded-xl text-2xl font-extrabold border ${TIER_BADGE[risk.tier]}`}>
                  {risk.tier}
                </div>
                <span className="text-xs text-slate-500">Action priority level</span>
              </div>

              {/* Trajectory */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trajectory</span>
                <TrajectoryBadge trajectory={risk.trajectory} />
                <span className="text-xs text-slate-500">Multi-period trend analysis</span>
              </div>
            </div>

            {/* Contributing factors multi-factor breakdown */}
            {risk.contributingFactors && (
              <div className="pt-4 border-t border-white/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                  Multi-Factor Engine Component Breakdown
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'Attendance (30%)', val: risk.contributingFactors.attendance },
                    { name: 'Academic (35%)', val: risk.contributingFactors.academic },
                    { name: 'Engagement (20%)', val: risk.contributingFactors.engagement },
                    { name: 'Trend (15%)', val: risk.contributingFactors.trend },
                  ].map(factor => (
                    <div key={factor.name} className="bg-slate-900/60 rounded-xl p-3 border border-white/5">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <span>{factor.name}</span>
                        <span className="font-mono text-white">{(factor.val * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            factor.val > 0.65 ? 'bg-red-500' : factor.val > 0.40 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.round(factor.val * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ═══ SECTION 4: ROOT CAUSE CLASSIFICATION ══════════════════════════ */}
        <Section title="Root Cause Classification" icon={<Brain className="w-4 h-4" />}>
          <div className="space-y-4">
            {/* Primary cause highlight */}
            <div className="glass-panel rounded-2xl p-6 border-l-4 border-indigo-500">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Primary likely cause</p>
              <p className="text-xl font-bold text-white">
                {rootCause.primary_cause}
                <span className="ml-3 text-sm font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                  {rootCause.confidence}% confidence
                </span>
              </p>
            </div>

            {/* Contributing factors */}
            <div className="glass-panel rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">Contributing factors</p>
              <ul className="space-y-2">
                {rootCause.factors.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Alternative causes */}
            <div className="glass-panel rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-4">Alternative causes considered</p>
              <div className="space-y-3">
                {rootCause.alt_causes.map((ac, i) => (
                  <div key={i} className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-sm font-medium text-slate-300">{ac.cause}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{ac.reason}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {ac.confidence}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ═══ SECTION 5: HUMAN-READABLE EXPLANATION ═════════════════════════ */}
        <Section title="Plain-Language Summary" icon={<FileText className="w-4 h-4" />}>
          <div className="glass-panel rounded-2xl p-6">
            <p className="text-slate-300 text-sm leading-relaxed">{rootCause.explanation}</p>
          </div>
        </Section>

        {/* ═══ SECTION 6: RECOMMENDED INTERVENTION ═══════════════════════════ */}
        <Section title="Recommended Intervention" icon={<Lightbulb className="w-4 h-4" />}>
          <div className="glass-panel rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Recommended support</p>
                <p className="text-lg font-bold text-white">{rootCause.recommendation}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${rootCause.rec_confidence}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">Confidence: {rootCause.rec_confidence}%</span>
              </div>
            </div>
            <AssignInterventionModal
              studentId={Number(id)}
              recommendation={rootCause.recommendation}
            />
          </div>
        </Section>

        {/* ═══ SECTION 7: INTERVENTION HISTORY ═══════════════════════════════ */}
        <Section title="Intervention History" icon={<Clock className="w-4 h-4" />}>
          <div className="glass-panel rounded-2xl px-6 py-2">
            {ivList.length === 0 ? (
              <div className="py-8 text-center">
                <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No interventions recorded yet.</p>
              </div>
            ) : (
              ivList.map(iv => <InterventionRow key={iv.id} iv={iv} />)
            )}
          </div>
        </Section>

      </div>
    </div>
  );
}
