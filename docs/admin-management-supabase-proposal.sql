-- REVIEW ONLY. Never executed by the app or this implementation task.
-- Review against deployed schema, triggers, grants, and RLS before applying manually.
-- Assumes profiles fields listed in the brief, UUID ids, digital_cards.user_id,
-- digital_cards.name/company/approval_status/created_at. Does not alter approval RPCs.
-- SECURITY DEFINER is required here to read cross-account data through a narrow API.
-- All returned objects explicitly allowlist fields. No auth internals are returned.
BEGIN;

-- Internal authorization helper; no direct client execution grant.
CREATE OR REPLACE FUNCTION public.yns_management_role(p_super boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_role text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL OR v_role NOT IN ('admin','super_admin') OR (p_super AND v_role <> 'super_admin') THEN
    RAISE EXCEPTION 'Management access denied';
  END IF;
  RETURN v_role;
END; $$;

-- Recovery only: the existing auth.users signup trigger remains unchanged.
-- Identity comes from auth.uid()/auth.users. Metadata can fill display name only.
-- ON CONFLICT preserves every existing role and admin relationship.
CREATE OR REPLACE FUNCTION public.ensure_current_profile()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid := auth.uid(); v_result jsonb;
BEGIN
  IF v_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  INSERT INTO public.profiles(id,email,full_name,role,admin_id,created_at,updated_at)
  SELECT u.id,u.email,coalesce(u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',''),'user',NULL,now(),now()
  FROM auth.users u WHERE u.id = v_id
  ON CONFLICT (id) DO NOTHING;
  -- Fill missing display data only; never overwrite established role/assignment/name.
  UPDATE public.profiles p SET
    full_name = coalesce(nullif(p.full_name,''),u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'name',''),
    email = coalesce(p.email,u.email), updated_at = now()
  FROM auth.users u WHERE p.id = v_id AND u.id = v_id
    AND (nullif(p.full_name,'') IS NULL OR p.email IS NULL);
  UPDATE public.profiles SET role = 'user', updated_at = now() WHERE id = v_id AND role IS NULL;
  SELECT jsonb_build_object('id',id,'email',email,'full_name',full_name,'role',role,'admin_id',admin_id,'created_at',created_at,'updated_at',updated_at)
  INTO v_result FROM public.profiles WHERE id = v_id;
  IF v_result IS NULL THEN RAISE EXCEPTION 'Profile unavailable'; END IF;
  RETURN v_result;
END; $$;

-- Super-admin-only lifetime counts; existing approval status values are unchanged.
CREATE OR REPLACE FUNCTION public.get_admin_management_summary()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.yns_management_role(true);
  RETURN jsonb_build_object(
    'total_admins',(SELECT count(*) FROM public.profiles WHERE role = 'admin'),
    'total_users',(SELECT count(*) FROM public.profiles WHERE role = 'user'),
    'pending',(SELECT count(*) FROM public.digital_cards WHERE approval_status = 'pending'),
    'approved',(SELECT count(*) FROM public.digital_cards WHERE approval_status = 'approved'),
    'rejected',(SELECT count(*) FROM public.digital_cards WHERE approval_status = 'rejected'));
END; $$;

-- Internal pagination validation. 101 permits a 100-row page plus hasMore sentinel.
CREATE OR REPLACE FUNCTION public.yns_validate_management_page(p_limit integer,p_offset integer,p_search text)
RETURNS void LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 101 OR p_offset IS NULL OR p_offset < 0 OR p_offset > 10000000 OR p_search IS NULL OR length(p_search) > 200 THEN
    RAISE EXCEPTION 'Invalid pagination';
  END IF;
END; $$;

-- Scoped directory. Admin filters can only narrow the caller's own assigned users.
CREATE OR REPLACE FUNCTION public.get_users_page(p_limit integer DEFAULT 26,p_offset integer DEFAULT 0,p_search text DEFAULT '',p_role text DEFAULT NULL,p_admin_id uuid DEFAULT NULL,p_unassigned boolean DEFAULT false)
RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_role text := public.yns_management_role(false);
BEGIN
  PERFORM public.yns_validate_management_page(p_limit,p_offset,p_search);
  IF p_role IS NOT NULL AND p_role NOT IN ('user','admin','super_admin') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF p_unassigned IS NULL OR (p_unassigned AND p_admin_id IS NOT NULL) THEN RAISE EXCEPTION 'Invalid assignment filter'; END IF;
  RETURN QUERY SELECT jsonb_build_object('id',p.id,'full_name',p.full_name,'email',p.email,'role',p.role,'admin_id',p.admin_id,'created_at',p.created_at)
  FROM public.profiles p
  WHERE (v_role = 'super_admin' OR (p.role = 'user' AND p.admin_id = auth.uid()))
    AND (p_role IS NULL OR p.role = p_role)
    AND (p_admin_id IS NULL OR p.admin_id = p_admin_id)
    AND (NOT p_unassigned OR p.admin_id IS NULL)
    AND (p_search = '' OR strpos(lower(coalesce(p.full_name,'')),lower(p_search)) > 0 OR strpos(lower(coalesce(p.email,'')),lower(p_search)) > 0)
  ORDER BY p.created_at DESC NULLS LAST,p.id DESC LIMIT p_limit OFFSET p_offset;
END; $$;

-- Super-admin admin directory with aggregate workload (no unrelated card contents).
CREATE OR REPLACE FUNCTION public.get_admins_page(p_limit integer DEFAULT 26,p_offset integer DEFAULT 0,p_search text DEFAULT '')
RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.yns_management_role(true);
  PERFORM public.yns_validate_management_page(p_limit,p_offset,p_search);
  RETURN QUERY SELECT jsonb_build_object('id',p.id,'full_name',p.full_name,'email',p.email,'role',p.role,'created_at',p.created_at,
    'assigned_user_count',(SELECT count(*) FROM public.profiles u WHERE u.admin_id = p.id AND u.role = 'user'),
    'pending_count',(SELECT count(*) FROM public.digital_cards c JOIN public.profiles u ON u.id = c.user_id WHERE u.admin_id = p.id AND u.role = 'user' AND c.approval_status = 'pending'))
  FROM public.profiles p WHERE p.role = 'admin'
    AND (p_search = '' OR strpos(lower(coalesce(p.full_name,'')),lower(p_search)) > 0 OR strpos(lower(coalesce(p.email,'')),lower(p_search)) > 0)
  ORDER BY p.created_at DESC NULLS LAST,p.id DESC LIMIT p_limit OFFSET p_offset;
END; $$;

-- Admin can request only their own roster; super admin can request any admin roster.
CREATE OR REPLACE FUNCTION public.get_admin_users(p_admin_id uuid,p_limit integer DEFAULT 26,p_offset integer DEFAULT 0,p_search text DEFAULT '')
RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_role text := public.yns_management_role(false);
BEGIN
  IF p_admin_id IS NULL OR (v_role <> 'super_admin' AND p_admin_id <> auth.uid()) THEN RAISE EXCEPTION 'Access denied'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'admin') THEN RAISE EXCEPTION 'Admin unavailable'; END IF;
  RETURN QUERY SELECT * FROM public.get_users_page(p_limit,p_offset,p_search,'user',p_admin_id,false);
END; $$;

-- Scoped safe detail, including a safe assigned-admin display label.
CREATE OR REPLACE FUNCTION public.get_management_user_detail(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_role text := public.yns_management_role(false); v_result jsonb;
BEGIN
  SELECT jsonb_build_object('id',p.id,'full_name',p.full_name,'email',p.email,'role',p.role,'admin_id',p.admin_id,'created_at',p.created_at,
    'admin_name',a.full_name,'admin_email',a.email,'card_count',(SELECT count(*) FROM public.digital_cards c WHERE c.user_id = p.id))
  INTO v_result FROM public.profiles p LEFT JOIN public.profiles a ON a.id = p.admin_id
  WHERE p.id = p_user_id AND (v_role = 'super_admin' OR (p.role = 'user' AND p.admin_id = auth.uid()));
  IF v_result IS NULL THEN RAISE EXCEPTION 'Account unavailable or access denied'; END IF;
  RETURN v_result;
END; $$;

-- Paginated relevant card information only, authorized independently of detail UI.
CREATE OR REPLACE FUNCTION public.get_management_user_cards(p_user_id uuid,p_limit integer DEFAULT 26,p_offset integer DEFAULT 0,p_search text DEFAULT '')
RETURNS SETOF jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.get_management_user_detail(p_user_id);
  PERFORM public.yns_validate_management_page(p_limit,p_offset,p_search);
  RETURN QUERY SELECT jsonb_build_object('id',c.id,'name',c.name,'company',c.company,'approval_status',c.approval_status,'created_at',c.created_at)
  FROM public.digital_cards c WHERE c.user_id = p_user_id
  ORDER BY c.created_at DESC NULLS LAST,c.id DESC LIMIT p_limit OFFSET p_offset;
END; $$;

-- Super-admin detail; never exposes auth.users or credentials.
CREATE OR REPLACE FUNCTION public.get_management_admin_detail(p_admin_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM public.yns_management_role(true);
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'admin') THEN RAISE EXCEPTION 'Admin unavailable'; END IF;
  RETURN public.get_management_user_detail(p_admin_id) || jsonb_build_object(
    'assigned_user_count',(SELECT count(*) FROM public.profiles WHERE admin_id = p_admin_id AND role = 'user'),
    'pending_count',(SELECT count(*) FROM public.digital_cards c JOIN public.profiles p ON p.id = c.user_id WHERE p.admin_id = p_admin_id AND p.role = 'user' AND c.approval_status = 'pending'));
END; $$;

-- Mutations serialize with each other so assignment cannot race an admin demotion.
-- Demotion rejects admins with assigned users: explicitly reassign/unassign first.
CREATE OR REPLACE FUNCTION public.set_user_role(p_user_id uuid,p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_target text;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(741204991::bigint);
  PERFORM public.yns_management_role(true);
  IF p_user_id IS NULL OR p_user_id = auth.uid() OR p_role IS NULL OR p_role NOT IN ('user','admin') THEN RAISE EXCEPTION 'Invalid role change'; END IF;
  SELECT role INTO v_target FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_target IS NULL OR v_target NOT IN ('user','admin') THEN RAISE EXCEPTION 'Target role cannot be changed'; END IF;
  IF p_role = 'user' AND EXISTS (SELECT 1 FROM public.profiles WHERE admin_id = p_user_id) THEN RAISE EXCEPTION 'Reassign all users before demotion'; END IF;
  UPDATE public.profiles SET role = p_role, admin_id = CASE WHEN p_role = 'admin' THEN NULL ELSE admin_id END, updated_at = now() WHERE id = p_user_id;
  -- All super_admin mutations are prohibited, preserving the last super_admin too.
END; $$;

-- Only super admin assigns users. NULL destination explicitly unassigns.
CREATE OR REPLACE FUNCTION public.assign_user_to_admin(p_user_id uuid,p_admin_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(741204991::bigint);
  PERFORM public.yns_management_role(true);
  IF p_user_id IS NULL OR p_user_id = auth.uid() OR p_user_id = p_admin_id THEN RAISE EXCEPTION 'Invalid assignment'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'user') THEN RAISE EXCEPTION 'User unavailable'; END IF;
  IF p_admin_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_admin_id AND role = 'admin') THEN RAISE EXCEPTION 'Admin unavailable'; END IF;
  UPDATE public.profiles SET admin_id = p_admin_id, updated_at = now() WHERE id = p_user_id;
END; $$;

-- Proposed table privilege hardening. REQUIRED: reconcile deployed column grants,
-- owner-update policies, signup triggers, and any other SECURITY DEFINER RPCs first.
-- RLS alone does not protect role/admin_id columns under a broad own-row UPDATE policy.
-- Client profile creation is removed; trusted signup trigger/recovery owns inserts.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM PUBLIC, anon, authenticated;
REVOKE INSERT (id,email,full_name,role,admin_id,created_at,updated_at),
       UPDATE (id,email,full_name,role,admin_id,created_at,updated_at)
ON public.profiles FROM PUBLIC, anon, authenticated;
-- No client profile writes exist in this repository. If deployed clients need them,
-- review a separate safe-field RPC rather than granting role/admin_id updates.

REVOKE ALL ON FUNCTION public.yns_management_role(boolean) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.yns_validate_management_page(integer,integer,text) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.ensure_current_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_current_profile() TO authenticated;

REVOKE ALL ON FUNCTION public.get_admin_management_summary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_management_summary() TO authenticated;

REVOKE ALL ON FUNCTION public.get_users_page(integer,integer,text,text,uuid,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_page(integer,integer,text,text,uuid,boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.get_admins_page(integer,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admins_page(integer,integer,text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_admin_users(uuid,integer,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users(uuid,integer,integer,text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_management_user_detail(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_management_user_detail(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_management_user_cards(uuid,integer,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_management_user_cards(uuid,integer,integer,text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_management_admin_detail(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_management_admin_detail(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.set_user_role(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid,text) TO authenticated;

REVOKE ALL ON FUNCTION public.assign_user_to_admin(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_to_admin(uuid,uuid) TO authenticated;

COMMIT;
