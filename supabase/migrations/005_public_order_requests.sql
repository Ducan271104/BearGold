-- BearGold public order-request flow.
-- Customers may submit a request without an account. This is NOT a payment or fulfillment endpoint.
-- Supplier authorization remains a separate gate; all requests start in pending_review.

alter table public.service_packages enable row level security;
drop policy if exists "service_packages_read_active" on public.service_packages;
create policy "service_packages_read_active"
on public.service_packages
for select to anon, authenticated
using (active = true or (select public.is_beargold_admin()));

revoke all on table public.service_packages from anon, authenticated;
grant select on table public.service_packages to anon, authenticated;

create table if not exists public.order_requests (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  tracking_token text not null unique,
  package_id text not null references public.service_packages(id),
  package_name text not null,
  duration_label text not null,
  credits_price integer not null check (credits_price > 0),
  locket_username text not null,
  contact_method text not null check (contact_method in ('phone', 'email')),
  contact_value text not null,
  customer_note text not null default '',
  status text not null default 'pending_review'
    check (status in ('pending_review', 'contacted', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_requests_created_idx
  on public.order_requests (created_at desc);
create index if not exists order_requests_status_created_idx
  on public.order_requests (status, created_at desc);

alter table public.order_requests enable row level security;

drop policy if exists "order_requests_staff_read" on public.order_requests;
create policy "order_requests_staff_read"
on public.order_requests
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'ctv')
  )
);

revoke all on table public.order_requests from anon, authenticated;
grant select on table public.order_requests to authenticated;

create or replace function public.create_public_order_request(
  p_tracking_token text,
  p_package_id text,
  p_locket_username text,
  p_contact_method text,
  p_contact_value text,
  p_customer_note text default ''
)
returns table(order_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_package public.service_packages%rowtype;
  v_code text;
  v_username text;
  v_contact text;
begin
  if p_tracking_token !~ '^[a-f0-9]{48}$' then
    raise exception 'INVALID_TOKEN';
  end if;

  v_username := pg_catalog.left(pg_catalog.btrim(coalesce(p_locket_username, '')), 80);
  v_contact := pg_catalog.left(pg_catalog.btrim(coalesce(p_contact_value, '')), 120);

  if p_package_id is null or v_username = ''
     or v_username !~ '^[A-Za-z0-9._-]{2,80}$'
     or p_contact_method not in ('phone', 'email')
     or pg_catalog.length(v_contact) < 5 then
    raise exception 'INVALID_INPUT';
  end if;

  if p_contact_method = 'email' and v_contact !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'INVALID_CONTACT';
  end if;
  if p_contact_method = 'phone' and v_contact !~ '^[0-9+() .-]{8,25}$' then
    raise exception 'INVALID_CONTACT';
  end if;

  select * into v_package
  from public.service_packages
  where id = p_package_id and active = true;

  if not found then
    raise exception 'PACKAGE_UNAVAILABLE';
  end if;

  v_code := 'BG-' || pg_catalog.upper(pg_catalog.substr(pg_catalog.replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.order_requests (
    order_code, tracking_token, package_id, package_name, duration_label,
    credits_price, locket_username, contact_method, contact_value, customer_note
  ) values (
    v_code, p_tracking_token, v_package.id, v_package.name, v_package.duration_label,
    v_package.credits_price, v_username, p_contact_method, v_contact,
    pg_catalog.left(pg_catalog.btrim(coalesce(p_customer_note, '')), 300)
  );

  return query select v_code;
end;
$$;

revoke all on function public.create_public_order_request(text, text, text, text, text, text) from public;
grant execute on function public.create_public_order_request(text, text, text, text, text, text) to anon, authenticated;

create or replace function public.get_public_order_status(p_tracking_token text)
returns table(order_code text, package_name text, duration_label text, status text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select o.order_code, o.package_name, o.duration_label, o.status, o.created_at
  from public.order_requests o
  where o.tracking_token = p_tracking_token
    and p_tracking_token ~ '^[a-f0-9]{48}$'
  limit 1;
$$;

revoke all on function public.get_public_order_status(text) from public;
grant execute on function public.get_public_order_status(text) to anon, authenticated;

comment on table public.order_requests is
  'Customer-submitted service inquiries. No payment, Credits debit, or service activation is performed here.';
