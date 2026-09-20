'use client';

import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { X, CalendarDays, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  studentId: number;
  recommendation: string;
}

const INTERVENTION_TYPES = [
  'Academic Tutoring',
  'Peer Mentoring',
  'Counselor Check-In',
  'Faculty Meeting',
  'Learning Support Plan',
  'Financial Aid Referral',
  'Health & Wellbeing Referral',
];

export default function AssignInterventionModal({ studentId, recommendation }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(recommendation);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createSupabaseBrowser();
      const { error: dbErr } = await supabase.from('interventions').insert({
        student_id: studentId,
        type,
        status: 'assigned',
        due_date: dueDate || null,
      });

      if (dbErr) throw dbErr;
      setSuccess(true);
      setTimeout(() => { setOpen(false); setSuccess(false); }, 1800);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-slate-800/70 border border-white/10 text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:border-white/20 transition-colors';

  return (
    <>
      <button
        id="assign-intervention-btn"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/30 hover:shadow-indigo-800/40"
      >
        <CalendarDays className="w-4 h-4" />
        Assign Intervention
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="glass-panel rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">Assign Intervention</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <p className="text-white font-semibold">Intervention assigned!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Intervention type
                  </label>
                  <select
                    id="intervention-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className={inputCls + ' appearance-none'}
                    required
                  >
                    {INTERVENTION_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Due date <span className="text-slate-600">(optional)</span>
                  </label>
                  <input
                    id="intervention-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputCls}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-assign-btn"
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Saving\u2026' : 'Confirm'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
