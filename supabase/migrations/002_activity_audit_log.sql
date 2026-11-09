-- BearGold activity audit log
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
begin
  if tg_op = 'INSERT' then
    v_action := 'Tạo tài khoản';
    v_metadata := jsonb_build_object(
      'email', new.email,
      'role', new.role
    );
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

drop trigger if exists bear_gold_profile_created_log on public.profiles;
create trigger bear_gold_profile_created_log
after insert on public.profiles
for each row execute function public.log_beargold_profile_activity();

drop trigger if exists bear_gold_profile_updated_log on public.profiles;
create trigger bear_gold_profile_updated_log
after update of role, credits on public.profiles
for each row execute function public.log_beargold_profile_activity();
