'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, TrendingDown, TrendingUp, 
  ShieldCheck, Database, Activity, Search, 
  UserCheck, Key
} from 'lucide-react';

interface StudentData {
  id: number; name: string; email: string; dept: string; year: number;
  tier: 'GREEN' | 'AMBER' | 'RED' | 'CRITICAL';
  trajectory: 'improving' | 'stable' | 'deteriorating';
  attendanceRate: number; avgScore: number; weeklyLogins: number;
  primaryCause: string;
  category: 'Normal' | 'Declining' | 'Recovering' | 'At-Risk' | 'Unclear';
  intervention?: string;
}

const students: StudentData[] = [
  { id:1,  name:'Aarav Sharma',     email:'aarav.sharma1@college.edu',     dept:'CSE',  year:1, tier:'GREEN',    trajectory:'stable',        attendanceRate:96, avgScore:91.5, weeklyLogins:12, primaryCause:'High Academic Self-Efficacy',        category:'Normal' },
  { id:2,  name:'Ananya Verma',     email:'ananya.verma2@college.edu',     dept:'DSAI', year:2, tier:'GREEN',    trajectory:'improving',     attendanceRate:98, avgScore:94.0, weeklyLogins:14, primaryCause:'High Academic Self-Efficacy',        category:'Normal' },
  { id:3,  name:'Rohan Patel',      email:'rohan.patel3@college.edu',      dept:'ECE',  year:3, tier:'GREEN',    trajectory:'stable',        attendanceRate:93, avgScore:88.2, weeklyLogins:10, primaryCause:'High Academic Self-Efficacy',        category:'Normal' },
  { id:4,  name:'Priya Reddy',      email:'priya.reddy4@college.edu',      dept:'MECH', year:4, tier:'GREEN',    trajectory:'improving',     attendanceRate:97, avgScore:90.0, weeklyLogins:13, primaryCause:'High Academic Self-Efficacy',        category:'Normal' },
  { id:5,  name:'Kavya Nair',       email:'kavya.nair5@college.edu',       dept:'BIS',  year:1, tier:'GREEN',    trajectory:'stable',        attendanceRate:95, avgScore:92.1, weeklyLogins:11, primaryCause:'High Academic Self-Efficacy',        category:'Normal' },
  { id:16, name:'Siddharth Bose',   email:'siddharth.bose16@college.edu',  dept:'CSE',  year:4, tier:'RED',     trajectory:'deteriorating', attendanceRate:58, avgScore:54.0, weeklyLogins:3,  primaryCause:'Attendance Disengagement',           category:'Declining',  intervention:'Attendance Warning & Wellness Check' },
  { id:17, name:'Pooja Chatterjee', email:'pooja.chatterjee17@college.edu',dept:'DSAI', year:1, tier:'AMBER',   trajectory:'deteriorating', attendanceRate:64, avgScore:61.5, weeklyLogins:4,  primaryCause:'Academic Burnout',                   category:'Declining',  intervention:'Attendance Warning & Wellness Check' },
  { id:18, name:'Karan Pandey',     email:'karan.pandey18@college.edu',    dept:'ECE',  year:2, tier:'AMBER',   trajectory:'deteriorating', attendanceRate:70, avgScore:58.0, weeklyLogins:5,  primaryCause:'Personal & Family Stress',           category:'Declining',  intervention:'Attendance Warning & Wellness Check' },
  { id:26, name:'Harsh Saxena',     email:'harsh.saxena26@college.edu',    dept:'CSE',  year:2, tier:'AMBER',   trajectory:'improving',     attendanceRate:82, avgScore:74.0, weeklyLogins:9,  primaryCause:'Positive Tutoring Response',         category:'Recovering', intervention:'Peer Mentorship Program (Completed)' },
  { id:27, name:'Anushka Pillai',   email:'anushka.pillai27@college.edu',  dept:'DSAI', year:3, tier:'GREEN',   trajectory:'improving',     attendanceRate:89, avgScore:82.5, weeklyLogins:11, primaryCause:'Positive Tutoring Response',         category:'Recovering', intervention:'Peer Mentorship Program (Completed)' },
  { id:34, name:'Dev Sharma',       email:'dev.sharma34@college.edu',      dept:'MECH', year:2, tier:'CRITICAL',trajectory:'deteriorating', attendanceRate:42, avgScore:41.0, weeklyLogins:1,  primaryCause:'Financial Strain & Off-Campus Work', category:'At-Risk',    intervention:'Emergency Faculty Tutoring (Pending)' },
  { id:35, name:'Isha Verma',       email:'isha.verma35@college.edu',      dept:'BIS',  year:3, tier:'CRITICAL',trajectory:'deteriorating', attendanceRate:39, avgScore:38.5, weeklyLogins:2,  primaryCause:'Mental Health & Social Isolation',   category:'At-Risk',    intervention:'Academic Counseling (In-Progress)' },
  { id:36, name:'Pranav Patel',     email:'pranav.patel36@college.edu',    dept:'CSE',  year:4, tier:'RED',     trajectory:'stable',        attendanceRate:48, avgScore:46.0, weeklyLogins:2,  primaryCause:'Severe Prerequisite Deficit',        category:'At-Risk',    intervention:'Emergency Faculty Tutoring (Pending)' },
  { id:37, name:'Ritu Iyer',        email:'ritu.iyer37@college.edu',       dept:'DSAI', year:1, tier:'RED',     trajectory:'deteriorating', attendanceRate:44, avgScore:39.0, weeklyLogins:1,  primaryCause:'Financial Strain & Off-Campus Work', category:'At-Risk',    intervention:'Academic Counseling (In-Progress)' },
  { id:38, name:'Sameer Reddy',     email:'sameer.reddy38@college.edu',    dept:'ECE',  year:2, tier:'CRITICAL',trajectory:'deteriorating', attendanceRate:37, avgScore:36.0, weeklyLogins:1,  primaryCause:'Mental Health & Social Isolation',   category:'At-Risk',    intervention:'Emergency Faculty Tutoring (Pending)' },
  { id:46, name:'Karthik Rao',      email:'karthik.rao46@college.edu',     dept:'CSE',  year:2, tier:'AMBER',   trajectory:'stable',        attendanceRate:68, avgScore:69.5, weeklyLogins:6,  primaryCause:'Bimodal Performance Discrepancy',    category:'Unclear',    intervention:'Diagnostic Skills Assessment' },
  { id:47, name:'Bhavna Joshi',     email:'bhavna.joshi47@college.edu',    dept:'DSAI', year:3, tier:'AMBER',   trajectory:'stable',        attendanceRate:71, avgScore:64.0, weeklyLogins:7,  primaryCause:'Bimodal Performance Discrepancy',    category:'Unclear',    intervention:'Diagnostic Skills Assessment' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'overview' | 'browser' | 'auth'>('overview');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'faculty' | 'counselor'>('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  const filtered = students.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      (s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.dept.toLowerCase().includes(q)) &&
      (tierFilter === 'ALL' || s.tier === tierFilter)
    );
  });

  const tabs = [
    { key: 'overview', label: 'Executive Overview' },
    { key: 'browser', label: 'Supabase Browser' },
    { key: 'auth', label: 'Auth Credentials' },
  ] as const;

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">Supabase Powered</span>
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">50 Students Seeded</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 text-white">
            Early Student Support System <span className="text-indigo-400">(ESS)</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time trajectory tracking, root cause diagnostics, and tiered academic interventions.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-white/10">
          <span className="text-xs text-slate-400 px-2 font-medium flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Role:</span>
          {(['admin', 'faculty', 'counselor'] as const).map(role => (
            <button key={role} onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                selectedRole === role ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}>{role}</button>
          ))}
        </div>
      </header>

      <div className="flex items-center gap-4 border-b border-white/10 mt-6 pb-0 text-sm">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`pb-3 px-1 font-medium transition-all ${
              activeTab === t.key ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'
            }`}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Green Tier',  icon: <ShieldCheck className="w-5 h-5" />, count: 15, sub: 'Attendance >90%',         color: 'emerald' },
              { label: 'Declining',   icon: <TrendingDown className="w-5 h-5" />, count: 10, sub: 'Deteriorating',           color: 'amber' },
              { label: 'Recovering',  icon: <TrendingUp className="w-5 h-5" />,  count: 8,  sub: 'Post-intervention',        color: 'blue' },
              { label: 'At-Risk',     icon: <AlertTriangle className="w-5 h-5" />,count: 12, sub: 'Critical signals',         color: 'red' },
              { label: 'Unclear',     icon: <Activity className="w-5 h-5" />,     count: 5,  sub: 'Bimodal patterns',         color: 'purple' },
            ].map(card => (
              <div key={card.label} className={`glass-panel p-5 rounded-2xl bg-${card.color}-950/10 border-${card.color}-500/20`}>
                <div className={`flex items-center justify-between text-${card.color}-400`}>
                  <span className="text-xs font-semibold uppercase">{card.label}</span>
                  {card.icon}
                </div>
                <div className="text-3xl font-bold mt-2 text-white">{card.count}</div>
                <p className={`text-xs text-${card.color}-400/80 mt-1`}>{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search students, email, or dept..."
                className="w-full bg-slate-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2">
              {['ALL','GREEN','AMBER','RED','CRITICAL'].map(tier => (
                <button key={tier} onClick={() => setTierFilter(tier)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    tierFilter === tier ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}>{tier}</button>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Dept / Year</th>
                    <th className="px-6 py-3.5">Risk Tier</th>
                    <th className="px-6 py-3.5">Trajectory</th>
                    <th className="px-6 py-3.5">Attendance</th>
                    <th className="px-6 py-3.5">Root Cause</th>
                    <th className="px-6 py-3.5">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">{s.dept} • Y{s.year}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          s.tier==='GREEN'    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          s.tier==='AMBER'    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          s.tier==='RED'      ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                'bg-red-700/20 text-red-300 border border-red-700/40'
                        }`}>{s.tier}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs capitalize">
                          {s.trajectory==='improving'    && <TrendingUp   className="w-4 h-4 text-emerald-400" />}
                          {s.trajectory==='stable'       && <Activity      className="w-4 h-4 text-slate-400" />}
                          {s.trajectory==='deteriorating'&& <TrendingDown  className="w-4 h-4 text-red-400" />}
                          <span className={s.trajectory==='improving'?'text-emerald-400':s.trajectory==='deteriorating'?'text-red-400':'text-slate-400'}>
                            {s.trajectory}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${
                              s.attendanceRate>=85?'bg-emerald-500':s.attendanceRate>=70?'bg-amber-500':'bg-red-500'
                            }`} style={{width:`${s.attendanceRate}%`}} />
                          </div>
                          <span className="font-mono text-xs">{s.attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-300">{s.primaryCause}</td>
                      <td className="px-6 py-4 text-xs">
                        {s.intervention
                          ? <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{s.intervention}</span>
                          : <span className="text-slate-600">None required</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'browser' && (
        <div className="glass-panel p-6 rounded-2xl mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="font-bold text-lg text-white">Supabase PostgreSQL — Table Browser</h3>
                <p className="text-xs text-slate-400">9 tables, FK constraints, and performance indexes</p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />SQL Seed Ready (205 KB)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { table:'departments',          rows:'5 rows',      desc:'CSE, DSAI, ECE, MECH, BIS',                          fk:'None (Root)' },
              { table:'users',                rows:'3 accounts',  desc:'Admin, Faculty, Counselor demo roles',               fk:'None' },
              { table:'students',             rows:'50 rows',     desc:'15 Normal · 10 Declining · 8 Rec · 12 Risk · 5 Unc', fk:'dept_id -> departments(id)' },
              { table:'attendance',           rows:'2,000 rows',  desc:'8 weeks Mon–Fri daily logs per student',             fk:'student_id -> students(id)' },
              { table:'academic_records',     rows:'600 rows',    desc:'4 exam checkpoints across core subjects',            fk:'student_id -> students(id)' },
              { table:'engagement',           rows:'400 rows',    desc:'LMS logins, task time, submissions per week',        fk:'student_id -> students(id)' },
              { table:'risk_assessments',     rows:'50 rows',     desc:'Score 0–1.00 · GREEN/AMBER/RED/CRITICAL tiers',      fk:'student_id -> students(id)' },
              { table:'root_cause_assessments',rows:'50 rows',   desc:'Burnout, Financial Strain, Absenteeism, etc.',       fk:'student_id -> students(id)' },
              { table:'interventions',        rows:'42 records',  desc:'Counseling, Tutoring, Mentorship, Diagnostics',      fk:'student_id, assigned_to' },
            ].map(item => (
              <div key={item.table} className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-indigo-400">{item.table}</span>
                  <span className="px-2 py-0.5 text-xs font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{item.rows}</span>
                </div>
                <p className="text-xs text-slate-300">{item.desc}</p>
                <p className="text-[11px] text-slate-500 font-mono">FK: {item.fk}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'auth' && (
        <div className="glass-panel p-6 rounded-2xl mt-6 space-y-6">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="font-bold text-lg text-white">Demo Authentication Accounts</h3>
              <p className="text-xs text-slate-400">Seeded in both public.users and auth.users via schema.sql</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { role:'Admin',     email:'admin@college.edu',     pw:'demo123', scope:'Full system oversight & configuration' },
              { role:'Faculty',   email:'faculty@college.edu',   pw:'demo123', scope:'Course grades, attendance entry & warnings' },
              { role:'Counselor', email:'counselor@college.edu', pw:'demo123', scope:'Root cause assessments & intervention plans' },
            ].map(u => (
              <div key={u.email} className="p-5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-500/20 text-indigo-300">{u.role}</span>
                <div className="pt-2 font-mono text-sm text-white">{u.email}</div>
                <div className="font-mono text-xs text-slate-400">Password: <span className="text-emerald-400">{u.pw}</span></div>
                <p className="text-xs text-slate-500 pt-1">{u.scope}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
