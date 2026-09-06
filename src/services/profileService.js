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
    .select('id,role,full_name,email,admin_id,created_at,updated_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error('Unable to load your account profile.');
  }

  const googleName =
    user.app_metadata?.provider === 'google'
      ? user.user_metadata?.full_name || user.user_metadata?.name
      : null;
  if (data?.role && !(googleName && !data.full_name)) return data;
  // The existing signup trigger remains primary. Recovery derives identity and role
  // on the server and never accepts protected fields from the client.
  const { data: recovered, error: recoveryError } = await supabase.rpc('ensure_current_profile');
  if (recoveryError || !recovered)
    throw new Error(
      'Unable to synchronize your account profile. Please retry or contact your administrator.'
    );
  return recovered;
}

export function isAdminUser(profile) {
  return profile?.role === 'admin' || profile?.role === 'super_admin';
}
