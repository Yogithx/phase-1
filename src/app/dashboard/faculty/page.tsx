import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardNav from '@/components/DashboardNav';
import FacultyStudentList from '@/components/FacultyStudentList';
import { DEMO_STUDENTS, DEMO_DEPARTMENTS, isDemoCredentials } from '@/lib/demoData';

export default async function FacultyDashboard() {
  const cookieStore = await cookies();
  const demoRole = cookieStore.get('ess-demo-role')?.value;
  const isDemo = demoRole === 'faculty' || isDemoCredentials();

  if (isDemo) {
    return (
      <div className="min-h-screen">
        <DashboardNav role="faculty" email="faculty@college.edu" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Faculty Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Student support signals &amp; risk overview for your cohort.
              <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">Demo Mode</span>
            </p>
          </div>
          <FacultyStudentList
            students={DEMO_STUDENTS as any}
            departments={DEMO_DEPARTMENTS}
          />
        </div>
      </div>
    );
  }

  const { createSupabaseServer } = await import('@/lib/supabase-server');
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('email', user.email!)
    .single();

  const role = userRow?.role ?? user.user_metadata?.role;
  if (role !== 'faculty') redirect(`/dashboard/${role ?? 'admin'}`);

  const { data: students } = await supabase
    .from('students')
    .select(`
      id, name, year, department_id,
      departments ( name ),
      risk_assessments ( risk_score, tier, trajectory, created_at ),
      root_cause_assessments ( primary_cause, confidence, created_at ),
      interventions ( status, created_at )
    `)
    .order('id', { ascending: true })
    .limit(50);

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .order('name');

  return (
    <div className="min-h-screen">
      <DashboardNav role="faculty" email={user.email!} />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Faculty Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Student support signals &amp; risk overview for your cohort.
          </p>
        </div>
        <FacultyStudentList
          students={students ?? []}
          departments={departments ?? []}
        />
      </div>
    </div>
  );
}
