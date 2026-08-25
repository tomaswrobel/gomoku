alter table profiles enable row level security;

create policy profiles_select_all on profiles for select using (true);
-- Writes only ever happen via the handle_new_user() trigger (security definer), never directly
-- from a client, so insert/update/delete are all denied here.
create policy profiles_no_insert on profiles for insert with check (false);
create policy profiles_no_update on profiles for update using (false);
create policy profiles_no_delete on profiles for delete using (false);
