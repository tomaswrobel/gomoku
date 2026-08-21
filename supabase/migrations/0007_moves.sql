create table moves (
	game_id text not null references games (id) on delete cascade,
	move_number int not null,
	coordinate text not null,
	player_id uuid references profiles (id),
	created_at timestamptz not null default now(),
	primary key (game_id, move_number)
);
