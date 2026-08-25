alter table games enable row level security;
alter table moves enable row level security;

create policy games_select_all on games for select using (true);
create policy games_no_insert on games for insert with check (false);
create policy games_no_update on games for update using (false);
create policy games_no_delete on games for delete using (false);

create policy moves_select_all on moves for select using (true);
create policy moves_no_insert on moves for insert with check (false);
create policy moves_no_update on moves for update using (false);
create policy moves_no_delete on moves for delete using (false);
