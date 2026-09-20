'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import {
  getInterventionsForCause,
  STATUS_COLORS, STATUS_LABELS, STATUS_PROGRESSION,
} from '@/lib/interventionKB';
import {
  X, CalendarDays, Loader2, CheckCircle2,
  ChevronRight, AlertCircle,
} from 'lucide-react';

interface Props {
  studentId: number;
  recommendation: string;
  rootCauseKey?: string;
  onSaved?: () => void;
}

interface StaffMember {
  id: string;
  email: string;
  role: string;
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl shadow-emerald-900/40">
      <CheckCircle2 className="w-4 h-4 shrink-0" />{msg}
    </div>
  );
}

export function InterventionStatusButton({
  interventionId, currentStatus, onUpdated,
}: {
  interventionId: number;
  currentStatus: string;
  onUpdated?: () => void;
}) {
  const [loading, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(currentStatus);
  const nextStatus = STATUS_PROGRESSION[localStatus];
  const canProgress = nextStatus && nextStatus !== localStatus;

  const handleProgress = () => {
    if (!canProgress) return;
    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      await supabase.from('interventions').update({ status: nextStatus }).eq('id', interventionId);
      setLocalStatus(nextStatus);
      onUpdated?.();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${STATUS_COLORS[localStatus] ?? STATUS_COLORS.recommended}`}>
        {STATUS_LABELS[localStatus] ?? localStatus}
      </span>
      {canProgress && (
        <button onClick={handleProgress} disabled={loading}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
          title={`Advance to ${STATUS_LABELS[nextStatus]}`}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
          {STATUS_LABELS[nextStatus]}
        </button>
      )}
    </div>
  );
}

export default function AssignInterventionModal({ studentId, recommendation, rootCauseKey, onSaved }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const options = getInterventionsForCause(rootCauseKey ?? recommendation);
  const [type, setType] = useState(options[0]?.type ?? recommendation);
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string>('recommended');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!open) return;
    (async () => {
      const supabase = createSupabaseBrowser();
      const { data } = await supabase.from('users').select('id, email, role').in('role', ['faculty', 'counselor']).order('role');
      if (data) setStaffList(data);
    })();
  }, [open]);

  useEffect(() => {
    setType(options[0]?.type ?? recommendation);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendation, rootCauseKey]);

  const handleClose = () => { if (!loading) setOpen(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const supabase = createSupabaseBrowser();
      const payload: Record<string, unknown> = { student_id: studentId, type, status, due_date: dueDate || null, notes: notes.trim() || null };
      if (assignedTo) payload.assigned_to = assignedTo;
      const { error: dbErr } = await supabase.from('interventions').insert(payload);
      if (dbErr) throw dbErr;
      setSuccess(true);
      setToast('Intervention assigned successfully');
      setTimeout(() => { setOpen(false); setSuccess(false); router.refresh(); onSaved?.(); }, 1200);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-slate-800/70 border border-white/10 text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 hover:border-white/20 transition-colors';
  const STATUS_OPTIONS = [
    { value: 'recommended', label: 'Recommended (not started)' },
    { value: 'pending',     label: 'Pending (awaiting acceptance)' },
    { value: 'assigned',    label: 'Assigned (confirmed)' },
    { value: 'in_progress', label: 'In Progress' },
  ];

  return (
    <>
      <button id="assign-intervention-btn" onClick={() => { setSuccess(false); setError(''); setOpen(true); }}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/30">
        <CalendarDays className="w-4 h-4" />Assign Intervention
      </button>
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
          <div className="glass-panel rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl border border-white/12 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-white">Assign Intervention</h3>
              <button onClick={handleClose} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-5">Pre-filled based on root cause · <span className="text-indigo-400 font-medium">{recommendation}</span></p>
            {success ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <p className="text-white font-semibold">Intervention assigned!</p>
                <p className="text-xs text-slate-500">Updating intervention history…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Intervention type <span className="text-red-500">*</span></label>
                  <select id="intervention-type" value={type} onChange={(e) => setType(e.target.value)} className={inputCls + ' appearance-none'} required>
                    <optgroup label={`Recommended for: ${recommendation}`}>
                      {options.map(opt => <option key={opt.type} value={opt.type}>{opt.type} — {opt.description}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Assign to <span className="text-slate-600">(optional)</span></label>
                  <select id="intervention-assignee" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={inputCls + ' appearance-none'}>
                    <option value="">— Unassigned —</option>
                    {staffList.length > 0 ? staffList.map(s => <option key={s.id} value={s.id}>{s.email} ({s.role})</option>) : (
                      <>
                        <option value="faculty-demo">Dr. Priya Nair (faculty)</option>
                        <option value="counselor-demo">Ms. Aarti Sharma (counselor)</option>
                        <option value="faculty-demo-2">Prof. Rajan Menon (faculty)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Initial status <span className="text-red-500">*</span></label>
                  <select id="intervention-status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls + ' appearance-none'} required>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Due date <span className="text-slate-600">(optional)</span></label>
                  <input id="intervention-due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} min={new Date().toISOString().slice(0, 10)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Notes <span className="text-slate-600">(optional)</span></label>
                  <textarea id="intervention-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls + ' resize-none'} rows={3} placeholder="Add context, observations, or specific instructions…" />
                </div>
                {error && (
                  <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{error}
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={handleClose} className="flex-1 py-2.5 text-sm font-medium text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors">Cancel</button>
                  <button id="confirm-assign-btn" type="submit" disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Saving…' : 'Confirm'}
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
