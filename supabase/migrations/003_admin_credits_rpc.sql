-- Secure Admin-only Credits adjustment for CTV accounts.
-- Run this migration in Supabase SQL Editor.

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
