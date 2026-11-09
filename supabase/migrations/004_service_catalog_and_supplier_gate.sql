-- BearGold service catalogue and supplier verification gate.
-- Catalogue can be displayed while ordering remains disabled.
-- No client-side writes or order/credit-debit functions are created here.

create table if not exists public.service_packages (
  id text primary key,
  name text not null,
  duration_label text not null,
  duration_days integer,
  credits_price integer not null check (credits_price > 0),
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_packages_duration_check
    check (duration_days is null or duration_days > 0)
);

create table if not exists public.supplier_verification (
  id integer primary key default 1 check (id = 1),
  supplier_name text,
  authorization_status text not null default 'pending'
    check (authorization_status in ('pending', 'verified', 'rejected')),
  evidence_reference text,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  order_activation_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint supplier_gate_requires_verification
    check (
      order_activation_enabled = false
      or (authorization_status = 'verified' and verified_at is not null and verified_by is not null)
    )
);

insert into public.service_packages
  (id, name, duration_label, duration_days, credits_price, description, active)
values
  ('7d', 'Locket Gold · 7 ngày', '7 ngày', 7, 5, 'Gói trải nghiệm ngắn hạn.', true),
  ('30d', 'Locket Gold · 30 ngày', '30 ngày', 30, 15, 'Gói sử dụng theo tháng.', true),
  ('365d', 'Locket Gold · 365 ngày', '365 ngày', 365, 100, 'Gói sử dụng theo năm.', true),
  ('lifetime', 'Locket Gold · Vĩnh viễn', 'Vĩnh viễn', null, 200, 'Chỉ cung cấp nếu nhà cung cấp xác nhận rõ quyền phân phối và thời hạn.', true)
on conflict (id) do update set
  name = excluded.name,
  duration_label = excluded.duration_label,
  duration_days = excluded.duration_days,
  credits_price = excluded.credits_price,
  description = excluded.description,
  active = excluded.active,
  updated_at = now();

insert into public.supplier_verification (id, authorization_status, order_activation_enabled)
values (1, 'pending', false)
on conflict (id) do nothing;

alter table public.service_packages enable row level security;
alter table public.supplier_verification enable row level security;

drop policy if exists "service_packages_read_active" on public.service_packages;
create policy "service_packages_read_active"
on public.service_packages
for select to authenticated
using (active = true or (select public.is_beargold_admin()));

drop policy if exists "supplier_verification_admin_read" on public.supplier_verification;
create policy "supplier_verification_admin_read"
on public.supplier_verification
for select to authenticated
using ((select public.is_beargold_admin()));

revoke all on table public.service_packages from anon, authenticated;
grant select on table public.service_packages to authenticated;

revoke all on table public.supplier_verification from anon, authenticated;
grant select on table public.supplier_verification to authenticated;

comment on table public.service_packages is
  'BearGold catalogue only. No order processing is enabled by this migration.';
comment on table public.supplier_verification is
  'Single-row authorization gate. Ordering must remain disabled until supplier authorization is verified.';
