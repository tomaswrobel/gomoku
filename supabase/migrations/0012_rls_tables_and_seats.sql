alter table tables enable row level security;

create policy tables_select_all on tables for select using (true);
create policy tables_no_insert on tables for insert with check (false);
create policy tables_no_update on tables for update using (false);
create policy tables_no_delete on tables for delete using (false);
