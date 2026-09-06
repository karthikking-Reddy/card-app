import { supabase } from '../../lib/supabase';
import { getCurrentProfile, isAdminUser } from './profileService';

export async function requireManagementAccess(superOnly = false) {
  const profile = await getCurrentProfile();
  if (!isAdminUser(profile) || (superOnly && profile.role !== 'super_admin')) {
    throw new Error('You do not have access to this management action.');
  }
  return profile;
}
async function call(name, args = {}, superOnly = false) {
  await requireManagementAccess(superOnly);
  const { data, error } = await supabase.rpc(name, args);
  if (error?.message === 'Reassign all users before demotion') {
    throw new Error('Reassign or unassign all users before demoting this admin.');
  }
  if (error)
    throw new Error(
      error.code === 'PGRST202'
        ? 'Management is not configured yet. Contact your administrator.'
        : 'Unable to complete this management request. Check your access and try again.'
    );
  return data;
}
async function pageCall(name, options = {}, extra = {}, superOnly = false) {
  const { page = 0, pageSize = 25, search = '' } = options;
  if (
    !Number.isInteger(page) ||
    page < 0 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    throw new Error('Invalid page.');
  const rows =
    (await call(
      name,
      {
        p_limit: pageSize + 1,
        p_offset: page * pageSize,
        p_search: search.trim().slice(0, 200),
        ...extra,
      },
      superOnly
    )) || [];
  return { data: rows.slice(0, pageSize), page, pageSize, hasMore: rows.length > pageSize };
}
export const getManagementSummary = () => call('get_admin_management_summary', {}, true);
export const getAdminsPage = (options) => pageCall('get_admins_page', options, {}, true);
export const getUsersPage = (options = {}) =>
  pageCall('get_users_page', options, {
    p_role: options.role || null,
    p_admin_id: options.adminId || null,
    p_unassigned: options.unassigned || false,
  });
export const getAdminUsers = (adminId, options) =>
  pageCall('get_admin_users', options, { p_admin_id: adminId });
export const getUserDetail = (id) => call('get_management_user_detail', { p_user_id: id });
export const getAdminDetail = (id) => call('get_management_admin_detail', { p_admin_id: id }, true);
export const getUserCardsPage = (id, options) =>
  pageCall('get_management_user_cards', options, { p_user_id: id });
export const assignUserToAdmin = (userId, adminId) =>
  call('assign_user_to_admin', { p_user_id: userId, p_admin_id: adminId }, true);
export const setUserRole = (userId, role) => {
  if (!['user', 'admin'].includes(role)) throw new Error('Unsupported role.');
  return call('set_user_role', { p_user_id: userId, p_role: role }, true);
};
