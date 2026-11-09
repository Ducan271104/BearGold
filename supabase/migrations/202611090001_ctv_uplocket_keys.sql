create table if not exists public.ctv_api_credentials (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  encrypted_key text not null,
  updated_at timestamptz not null default now()
);

alter table public.ctv_api_credentials enable row level security;

-- No client policies: reads and writes are performed only by server routes
-- using the Supabase service-role key. Never expose that key to the browser.
