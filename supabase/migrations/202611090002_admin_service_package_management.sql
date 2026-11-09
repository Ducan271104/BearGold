-- Admin-only management for the existing service_packages catalogue.
-- Prices and visibility only; this does not enable checkout or credit debits.

create or replace function public.admin_update_service_package(
  p_package_id text,
  p_credits_price integer,
  p_active boolean
)
returns table(id text, credits_price integer, active boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_package_id text;
begin
  if v_actor is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if not exists (
    select 1 from public.profiles
    where profiles.id = v_actor and profiles.role = 'admin'
  ) then
    raise exception 'FORBIDDEN';
  end if;

  if p_package_id is null or length(trim(p_package_id)) = 0
     or p_credits_price is null or p_credits_price < 1 or p_credits_price > 100000
     or p_active is null then
    raise exception 'INVALID_INPUT';
  end if;

  update public.service_packages
     set credits_price = p_credits_price,
         active = p_active
   where service_packages.id::text = p_package_id
   returning service_packages.id::text into v_package_id;

  if v_package_id is null then
    raise exception 'NOT_FOUND';
  end if;

  insert into public.activity_logs(actor_id, action, target, metadata)
  values (
    v_actor,
    'service_package_updated',
    v_package_id,
    jsonb_build_object('credits_price', p_credits_price, 'active', p_active)
  );

  return query
    select sp.id::text, sp.credits_price, sp.active
    from public.service_packages sp
    where sp.id::text = v_package_id;
end;
$$;

revoke all on function public.admin_update_service_package(text, integer, boolean) from public;
grant execute on function public.admin_update_service_package(text, integer, boolean) to authenticated;
