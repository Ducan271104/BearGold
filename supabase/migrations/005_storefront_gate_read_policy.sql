-- Allow signed-in storefront users to read only the public supplier gate fields.
-- Supplier identity and authorization evidence remain admin-only.
drop policy if exists "supplier_verification_admin_read" on public.supplier_verification;
drop policy if exists "supplier_verification_authenticated_gate_read" on public.supplier_verification;
create policy "supplier_verification_authenticated_gate_read"
on public.supplier_verification
for select
to authenticated
using (true);

revoke all on table public.supplier_verification from anon, authenticated;
grant select (authorization_status, order_activation_enabled)
on table public.supplier_verification to authenticated;

comment on policy "supplier_verification_authenticated_gate_read"
on public.supplier_verification is
  'Authenticated users may read only the storefront gate columns; supplier identity and evidence remain restricted.';
