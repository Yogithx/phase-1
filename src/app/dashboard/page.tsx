import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';

export default async function DashboardRoot() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: userRow } = await supabase.from('users').select('role').eq('email', user.email!).single();
  const role = userRow?.role ?? user.user_metadata?.role ?? 'admin';
  redirect(`/dashboard/${role}`);
}
