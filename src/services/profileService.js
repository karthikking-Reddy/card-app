import { supabase } from '../../lib/supabase';

export async function getCurrentProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unable to load your account profile.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role,full_name,email')
    .eq('id', user.id)
    .single();

  if (error) {
    throw new Error('Unable to load your account profile.');
  }

  return data;
}

export function isAdminUser(profile) {
  return profile?.role === 'admin' || profile?.role === 'super_admin';
}
