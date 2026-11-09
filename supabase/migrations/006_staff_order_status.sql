
-- Staff can update only the workflow status; order identity and customer data remain immutable.
drop policy if exists "order_requests_staff_update" on public.order_requests;
create policy "order_requests_staff_update"
on public.order_requests
for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'ctv')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'ctv')
  )
);
grant update (status) on public.order_requests to authenticated;
