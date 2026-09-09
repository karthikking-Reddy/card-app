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

export async function updateCurrentProfileName(fullName) {
  const name = String(fullName || '').trim();
  if (name.length < 2 || name.length > 120) {
    throw new Error('Enter a name between 2 and 120 characters.');
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Please sign in again.');
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: name })
    .eq('id', user.id)
    .select('id,role,full_name,email,admin_id,created_at,updated_at')
    .single();
  if (error) throw new Error('Unable to update your account name.');
  return data;
}

export async function getAccountSummary(userId) {
  if (!userId) throw new Error('A signed-in user is required.');
  const [cards, leads] = await Promise.all([
    supabase
      .from('digital_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('connections')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', userId),
  ]);
  if (cards.error || leads.error) throw new Error('Unable to load account usage.');
  return { cards: cards.count || 0, leads: leads.count || 0 };
}
