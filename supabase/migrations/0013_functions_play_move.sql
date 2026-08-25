-- Coordinate <-> (x, y) helpers, matching src/lib/game/coordinate/*.ts: letters A-O (0-based x),
-- rows 1-15 (1-based, stored as 0-based y).
create or replace function coord_to_xy(p_coordinate text, out x int, out y int)
language plpgsql
immutable
as $$
begin
	x := ascii(upper(substr(p_coordinate, 1, 1))) - ascii('A');
	y := substr(p_coordinate, 2)::int - 1;
end;
$$;

create or replace function coord_from_xy(p_x int, p_y int)
returns text
language plpgsql
immutable
as $$
begin
	return chr(ascii('A') + p_x) || (p_y + 1)::text;
end;
$$;

-- Direction-scan win check, ported from src/lib/game/checkFiveInRow.ts. `p_overline_wins` mirrors
-- the client Settings.overlineWins flag: online games always play with overlineWins = false
-- (exactly 5), matching the default local ruleset.
create or replace function check_five_in_row(p_game_id text, p_last text, p_color seat_color)
returns boolean
language plpgsql
stable
as $$
declare
	v_x0 int;
	v_y0 int;
	v_dx int;
	v_dy int;
	v_sign int;
	v_x int;
	v_y int;
	v_count int;
	v_directions int[][] := array[[1, 0], [0, 1], [1, 1], [1, -1]];
	v_dir int;
begin
	select x, y into v_x0, v_y0 from coord_to_xy(p_last);

	for v_dir in 1..4 loop
		v_dx := v_directions[v_dir][1];
		v_dy := v_directions[v_dir][2];
		v_count := 1;
		foreach v_sign in array array[-1, 1] loop
			v_x := v_x0 + v_dx * v_sign;
			v_y := v_y0 + v_dy * v_sign;
			while v_x >= 0 and v_x < 15 and v_y >= 0 and v_y < 15 loop
				if not exists (
					select 1
					from moves
					where game_id = p_game_id
						and coordinate = coord_from_xy(v_x, v_y)
						and (case when move_number % 2 = 0 then 'Black' else 'White' end)::seat_color = p_color
				) then
					exit;
				end if;
				v_count := v_count + 1;
				v_x := v_x + v_dx * v_sign;
				v_y := v_y + v_dy * v_sign;
			end loop;
		end loop;
		if v_count = 5 then
			return true;
		end if;
	end loop;
	return false;
end;
$$;

create or replace function create_game(
	p_kind game_kind,
	p_table_id smallint,
	p_opponent_id uuid,
	p_opening_rule opening_rule,
	p_time_control time_control
)
returns games
language plpgsql
security definer
set search_path = public
as $$
declare
	v_caller uuid := auth.uid();
	v_caller_name text;
	v_opponent_name text;
	v_bank_ms int;
	v_game games%rowtype;
begin
	if v_caller is null then
		raise exception 'not authenticated';
	end if;

	select display_name into v_caller_name from profiles where id = v_caller;
	select display_name into v_opponent_name from profiles where id = p_opponent_id;
	if v_opponent_name is null then
		raise exception 'opponent not found';
	end if;

	v_bank_ms := p_time_control::int * 60000;

	insert into games (
		kind, table_id, opening_rule, time_control, status,
		player1_id, player2_id, player1_name, player2_name,
		player1_clock_ms, player2_clock_ms, started_at, clock_running_since
	) values (
		p_kind, p_table_id, p_opening_rule, p_time_control, 'active',
		v_caller, p_opponent_id, v_caller_name, v_opponent_name,
		v_bank_ms, v_bank_ms, now(), now()
	)
	returning * into v_game;

	return v_game;
end;
$$;

create or replace function sit_at_table(p_table_id smallint, p_time_control time_control)
returns games
language plpgsql
security definer
set search_path = public
as $$
declare
	v_caller uuid := auth.uid();
	v_caller_name text;
	v_other_seat room_seats%rowtype;
	v_bank_ms int;
	v_game games%rowtype;
begin
	if v_caller is null then
		raise exception 'not authenticated';
	end if;

	select display_name into v_caller_name from profiles where id = v_caller;

	perform 1 from tables where id = p_table_id for update;

	if exists (select 1 from room_seats where table_id = p_table_id and player_id = v_caller) then
		raise exception 'already seated at this table';
	end if;

	select * into v_other_seat from room_seats where table_id = p_table_id limit 1 for update;

	if v_other_seat is null then
		insert into room_seats (table_id, seat, player_id) values (p_table_id, 1, v_caller);
		return null;
	end if;

	if (select count(*) from room_seats where table_id = p_table_id) >= 2 then
		raise exception 'table is full';
	end if;

	v_bank_ms := p_time_control::int * 60000;

	insert into games (
		kind, table_id, opening_rule, time_control, status,
		player1_id, player2_id, player1_name, player2_name,
		player1_clock_ms, player2_clock_ms, started_at, clock_running_since
	) values (
		'room', p_table_id, 'swap2', p_time_control, 'active',
		v_other_seat.player_id, v_caller,
		(select display_name from profiles where id = v_other_seat.player_id), v_caller_name,
		v_bank_ms, v_bank_ms, now(), now()
	)
	returning * into v_game;

	insert into room_seats (table_id, seat, player_id, game_id) values (p_table_id, 2, v_caller, v_game.id);
	update room_seats set game_id = v_game.id where table_id = p_table_id and seat = 1;

	return v_game;
end;
$$;

create or replace function leave_table(p_table_id smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_caller uuid := auth.uid();
	v_seat room_seats%rowtype;
	v_game games%rowtype;
begin
	if v_caller is null then
		raise exception 'not authenticated';
	end if;

	select * into v_seat from room_seats where table_id = p_table_id and player_id = v_caller for update;
	if not found then
		return;
	end if;

	if v_seat.game_id is not null then
		select * into v_game from games where id = v_seat.game_id for update;
		if v_game.status = 'active' or v_game.status = 'waiting' then
			update games set
				status = 'aborted',
				result = 'win',
				winner_color = case
					when v_seat.player_id = v_game.player1_id then
						case when v_game.swapped then 'Black' else 'White' end
					else
						case when v_game.swapped then 'White' else 'Black' end
				end,
				finished_at = now(),
				clock_running_since = null
			where id = v_game.id;
		end if;
	end if;

	delete from room_seats where table_id = p_table_id and seat = v_seat.seat;
end;
$$;

create or replace function play_move(p_game_id text, p_coordinate text)
returns games
language plpgsql
security definer
set search_path = public
as $$
declare
	v_game games%rowtype;
	v_seat_color seat_color;
	v_caller uuid := auth.uid();
	v_move_number int;
	v_expected_player uuid;
	v_elapsed_ms bigint;
	v_win boolean;
begin
	if v_caller is null then
		raise exception 'not authenticated';
	end if;

	select * into v_game from games where id = p_game_id for update;
	if not found then
		raise exception 'game not found';
	end if;
	if v_game.status <> 'active' then
		raise exception 'game not active';
	end if;

	select count(*) into v_move_number from moves where game_id = p_game_id;
	v_seat_color := case when v_move_number % 2 = 0 then 'Black' else 'White' end;

	if (v_seat_color = 'Black') = not v_game.swapped then
		v_expected_player := v_game.player1_id;
	else
		v_expected_player := v_game.player2_id;
	end if;
	if v_expected_player is distinct from v_caller then
		raise exception 'not your turn';
	end if;

	if p_coordinate !~ '^[A-O](1[0-5]|[1-9])$' then
		raise exception 'coordinate out of bounds';
	end if;
	if exists (select 1 from moves where game_id = p_game_id and coordinate = p_coordinate) then
		raise exception 'cell occupied';
	end if;

	v_elapsed_ms := 0;
	if v_game.clock_running_since is not null then
		v_elapsed_ms := greatest(
			0,
			floor(extract(epoch from (now() - v_game.clock_running_since)) * 1000)
		)::bigint;
	end if;

	if v_expected_player = v_game.player1_id then
		v_game.player1_clock_ms := greatest(0, v_game.player1_clock_ms - v_elapsed_ms);
	else
		v_game.player2_clock_ms := greatest(0, v_game.player2_clock_ms - v_elapsed_ms);
	end if;

	if v_game.player1_clock_ms = 0 or v_game.player2_clock_ms = 0 then
		v_game.status := 'finished';
		v_game.result := 'win';
		v_game.winner_color := case
			when v_game.player1_clock_ms = 0 then
				case when v_game.swapped then 'Black' else 'White' end
			else
				case when v_game.swapped then 'White' else 'Black' end
		end;
		v_game.finished_at := now();
		v_game.clock_running_since := null;

		update games set
			status = v_game.status, result = v_game.result, winner_color = v_game.winner_color,
			finished_at = v_game.finished_at, clock_running_since = v_game.clock_running_since,
			player1_clock_ms = v_game.player1_clock_ms, player2_clock_ms = v_game.player2_clock_ms
		where id = p_game_id;

		return v_game;
	end if;

	insert into moves (game_id, move_number, coordinate, player_id)
	values (p_game_id, v_move_number, p_coordinate, v_caller);

	v_win := check_five_in_row(p_game_id, p_coordinate, v_seat_color);

	if v_win then
		v_game.status := 'finished';
		v_game.result := 'win';
		v_game.winner_color := v_seat_color;
		v_game.finished_at := now();
		v_game.clock_running_since := null;
	elsif (v_move_number + 1) >= 225 then
		v_game.status := 'finished';
		v_game.result := 'draw';
		v_game.finished_at := now();
		v_game.clock_running_since := null;
	else
		v_game.clock_running_since := now();
	end if;

	update games set
		status = v_game.status,
		result = v_game.result,
		winner_color = v_game.winner_color,
		finished_at = v_game.finished_at,
		clock_running_since = v_game.clock_running_since,
		player1_clock_ms = v_game.player1_clock_ms,
		player2_clock_ms = v_game.player2_clock_ms,
		started_at = coalesce(started_at, now())
	where id = p_game_id;

	return v_game;
end;
$$;
