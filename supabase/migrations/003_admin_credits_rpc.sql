-- Secure Admin-only Credits adjustment for CTV accounts.
-- Run this migration in Supabase SQL Editor.

create or replace function public.log_beargold_profile_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text;
  v_metadata jsonb;
  v_reason text;
begin
  if tg_op = 'INSERT' then
    v_action := 'Tạo tài khoản';
    v_metadata := jsonb_build_object('email', new.email, 'role', new.role);
  else
    if new.credits is distinct from old.credits
       and new.role is distinct from old.role then
      v_action := 'Thay đổi vai trò và Credits';
    elsif new.credits is distinct from old.credits then
      v_action := 'Điều chỉnh Credits';
    elsif new.role is distinct from old.role then
      v_action := 'Thay đổi vai trò';
    else
      return new;
    end if;

    v_metadata := jsonb_build_object(
      'email', new.email,
      'old_role', old.role,
      'new_role', new.role,
      'old_credits', old.credits,
      'new_credits', new.credits
    );

    v_reason := nullif(pg_catalog.current_setting('app.beargold_credits_reason', true), '');
    if v_reason is not null then
      v_metadata := v_metadata || jsonb_build_object('reason', v_reason);
    end if;
  end if;

  insert into public.activity_logs (actor_id, action, target, metadata)
  values (
    case when tg_op = 'INSERT' then new.id else auth.uid() end,
    v_action,
    new.id::text,
    v_metadata
  );

  return new;
end;
$$;

revoke all on function public.log_beargold_profile_activity() from public;

create or replace function public.admin_adjust_ctv_credits(
  p_target_id uuid,
  p_delta integer,
  p_reason text default ''
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_credits integer;
  v_reason text;
begin
  if (select auth.uid()) is null
     or not public.is_beargold_admin() then
    raise exception 'FORBIDDEN: Admin permission required';
  end if;

  if p_target_id is null
     or p_delta is null
     or p_delta = 0
     or abs(p_delta::bigint) > 100000 then
    raise exception 'INVALID_INPUT: Invalid target or Credits amount';
  end if;

  v_reason := left(trim(coalesce(p_reason, '')), 200);

  select role, credits
    into v_role, v_credits
  from public.profiles
  where id = p_target_id
  for update;

  if not found then
    raise exception 'NOT_FOUND: Member does not exist';
  end if;

  if v_role <> 'ctv' then
    raise exception 'INVALID_TARGET: Credits can only be adjusted for CTV accounts';
  end if;

  if v_credits + p_delta < 0 then
    raise exception 'INSUFFICIENT_CREDITS: Credits cannot become negative';
  end if;

  perform pg_catalog.set_config('app.beargold_credits_reason', v_reason, true);

  update public.profiles
  set credits = v_credits + p_delta,
      updated_at = now()
  where id = p_target_id;

  return v_credits + p_delta;
end;
$$;

revoke all on function public.admin_adjust_ctv_credits(uuid, integer, text) from public;
revoke all on function public.admin_adjust_ctv_credits(uuid, integer, text) from anon;
grant execute on function public.admin_adjust_ctv_credits(uuid, integer, text) to authenticated;
