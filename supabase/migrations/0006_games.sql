create table games (
	id text primary key default nanoid(12),
	kind game_kind not null,
	table_id smallint references tables (id),
	opening_rule opening_rule not null,
	time_control time_control not null,
	status game_status not null default 'waiting',
	result game_result,
	swapped boolean not null default false,
	winner_color seat_color,
	player1_id uuid references profiles (id),
	player2_id uuid references profiles (id),
	player1_name text not null,
	player2_name text not null,
	player1_clock_ms int not null,
	player2_clock_ms int not null,
	clock_running_since timestamptz,
	created_at timestamptz not null default now(),
	started_at timestamptz,
	finished_at timestamptz,
	check (player1_id is distinct from player2_id)
);

create index games_open_table_idx on games (table_id) where status in ('waiting', 'active');
create index games_player1_idx on games (player1_id);
create index games_player2_idx on games (player2_id);
create index games_finished_idx on games (finished_at desc) where status = 'finished';
