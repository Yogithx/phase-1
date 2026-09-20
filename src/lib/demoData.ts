/**
 * Demo data for ESS hackathon demo mode.
 * Used when Supabase is not configured (placeholder credentials).
 */

export const DEMO_STUDENTS = [
  {
    id: 1,
    name: 'Arjun Mehta',
    year: 2,
    department_id: 1,
    departments: { name: 'Computer Science & Engineering' },
    risk_assessments: [{ risk_score: 0.82, tier: 'CRITICAL', trajectory: 'declining', created_at: '2026-09-15' }],
    root_cause_assessments: [{ primary_cause: 'ACADEMIC_DIFFICULTY', confidence: 78, created_at: '2026-09-15' }],
    interventions: [{ status: 'in_progress', created_at: '2026-09-16' }],
  },
  {
    id: 2,
    name: 'Priya Sharma',
    year: 3,
    department_id: 3,
    departments: { name: 'Electronics & Communication' },
    risk_assessments: [{ risk_score: 0.71, tier: 'RED', trajectory: 'declining', created_at: '2026-09-15' }],
    root_cause_assessments: [{ primary_cause: 'FINANCIAL_HARDSHIP', confidence: 65, created_at: '2026-09-15' }],
    interventions: [{ status: 'recommended', created_at: '2026-09-16' }],
  },
  {
    id: 3,
    name: 'Ravi Krishnamurthy',
    year: 1,
    department_id: 4,
    departments: { name: 'Mechanical Engineering' },
    risk_assessments: [{ risk_score: 0.68, tier: 'RED', trajectory: 'stable', created_at: '2026-09-15' }],
    root_cause_assessments: [{ primary_cause: 'SOCIAL_ISOLATION', confidence: 60, created_at: '2026-09-15' }],
    interventions: [],
  },
  {
    id: 4,
    name: 'Sneha Iyer',
    year: 2,
    department_id: 2,
    departments: { name: 'Data Science & AI' },
    risk_assessments: [{ risk_score: 0.55, tier: 'AMBER', trajectory: 'stable', created_at: '2026-09-15' }],
    root_cause_assessments: [{ primary_cause: 'MOTIVATIONAL', confidence: 55, created_at: '2026-09-15' }],
    interventions: [],
  },
  {
    id: 5,
    name: 'Karthik Nair',
    year: 3,
    department_id: 1,
    departments: { name: 'Computer Science & Engineering' },
    risk_assessments: [{ risk_score: 0.40, tier: 'AMBER', trajectory: 'improving', created_at: '2026-09-15' }],
    root_cause_assessments: [{ primary_cause: 'ACADEMIC_DIFFICULTY', confidence: 50, created_at: '2026-09-15' }],
    interventions: [{ status: 'completed', created_at: '2026-09-10' }],
  },
  {
    id: 6,
    name: 'Divya Reddy',
    year: 4,
    department_id: 5,
    departments: { name: 'Business Information Systems' },
    risk_assessments: [{ risk_score: 0.28, tier: 'GREEN', trajectory: 'stable', created_at: '2026-09-15' }],
    root_cause_assessments: [],
    interventions: [],
  },
  {
    id: 7,
    name: 'Aditya Bansal',
    year: 2,
    department_id: 6,
    departments: { name: 'Civil Engineering' },
    risk_assessments: [{ risk_score: 0.76, tier: 'RED', trajectory: 'declining', created_at: '2026-09-15' }],
    root_cause_assessments: [{ primary_cause: 'HEALTH_RELATED', confidence: 70, created_at: '2026-09-15' }],
    interventions: [{ status: 'assigned', created_at: '2026-09-17' }],
  },
  {
    id: 8,
    name: 'Meera Pillai',
    year: 1,
    department_id: 7,
    departments: { name: 'Electrical Engineering' },
    risk_assessments: [{ risk_score: 0.60, tier: 'AMBER', trajectory: 'declining', created_at: '2026-09-15' }],
    root_cause_assessments: [{ primary_cause: 'MOTIVATIONAL', confidence: 58, created_at: '2026-09-15' }],
    interventions: [],
  },
];

export const DEMO_DEPARTMENTS = [
  { id: 1, name: 'Computer Science & Engineering' },
  { id: 2, name: 'Data Science & AI' },
  { id: 3, name: 'Electronics & Communication' },
  { id: 4, name: 'Mechanical Engineering' },
  { id: 5, name: 'Business Information Systems' },
  { id: 6, name: 'Civil Engineering' },
  { id: 7, name: 'Electrical Engineering' },
  { id: 8, name: 'Information Technology' },
];

export const DEMO_ROOT_CAUSES = [
  { id: 1, primary_cause: 'ACADEMIC_DIFFICULTY', confidence: 78, factors: ['Quiz scores dropping', 'High study time', 'Low assignment completion'], created_at: '2026-09-15', students: { name: 'Arjun Mehta', email: 'arjun@demo.edu' } },
  { id: 2, primary_cause: 'FINANCIAL_HARDSHIP',  confidence: 65, factors: ['Missing LMS logins', 'Declined engagement', 'Irregular submission pattern'], created_at: '2026-09-15', students: { name: 'Priya Sharma', email: 'priya@demo.edu' } },
  { id: 3, primary_cause: 'SOCIAL_ISOLATION',    confidence: 60, factors: ['Low discussion participation', 'No peer group activity', 'Attendance declining'], created_at: '2026-09-15', students: { name: 'Ravi Krishnamurthy', email: 'ravi@demo.edu' } },
  { id: 4, primary_cause: 'HEALTH_RELATED',      confidence: 70, factors: ['Sudden attendance drop', 'Frequent late submissions', 'Previous stable record'], created_at: '2026-09-17', students: { name: 'Aditya Bansal', email: 'aditya@demo.edu' } },
  { id: 5, primary_cause: 'MOTIVATIONAL',        confidence: 55, factors: ['Gradual disengagement', 'Low quiz attempts', 'Occasional absences'], created_at: '2026-09-15', students: { name: 'Sneha Iyer', email: 'sneha@demo.edu' } },
];

export const DEMO_INTERVENTIONS = [
  { id: 1, type: 'Tutoring', status: 'in_progress', due_date: '2026-10-01', outcome: null },
  { id: 2, type: 'Financial Aid Referral', status: 'assigned', due_date: '2026-09-28', outcome: null },
  { id: 3, type: 'Counseling Session', status: 'completed', due_date: '2026-09-10', outcome: 'Student reported improved outlook. Follow up in 2 weeks.' },
];

export function isDemoCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return url.includes('your-project') || url === '' || url === 'placeholder';
}
