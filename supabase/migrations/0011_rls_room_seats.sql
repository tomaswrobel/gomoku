alter table room_seats enable row level security;

create policy room_seats_select_all on room_seats for select using (true);
-- Seat claims/releases only happen via sit_at_table()/leave_table() (security definer).
create policy room_seats_no_insert on room_seats for insert with check (false);
create policy room_seats_no_update on room_seats for update using (false);
create policy room_seats_no_delete on room_seats for delete using (false);
