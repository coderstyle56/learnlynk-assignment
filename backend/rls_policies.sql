-- LearnLynk Tech Test - Task 2: RLS Policies on leads

alter table public.leads enable row level security;

---------------------------------------------------------
-- SELECT Policy
---------------------------------------------------------
create policy "allow_admins_and_counselors_to_read_leads"
on public.leads
for select
using (
  (
    -- Admins can read all leads in their tenant
    (auth.jwt() ->> 'role') = 'admin'
    and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  )
  or
  (
    -- Counselors can read leads they own
    (auth.jwt() ->> 'role') = 'counselor'
    and owner_id = auth.uid()
  )
  or
  (
    -- Counselors can read leads if they belong to a team in the same tenant
    (auth.jwt() ->> 'role') = 'counselor'
    and tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and exists (
      select 1 from public.user_teams ut
      where ut.user_id = auth.uid()
    )
  )
);

---------------------------------------------------------
-- INSERT Policy
---------------------------------------------------------
create policy "allow_admins_and_counselors_to_insert_leads"
on public.leads
for insert
with check (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  and (auth.jwt() ->> 'role') in ('admin', 'counselor')
);
