create table room_seats (
	table_id smallint not null references tables (id),
	seat smallint not null check (seat in (1, 2)),
	player_id uuid not null references profiles (id),
	game_id text references games (id),
	seated_at timestamptz not null default now(),
	primary key (table_id, seat)
);
