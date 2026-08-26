-- Ports the Swap2 opening negotiation (src/lib/game/Game.svelte.ts's Opening/Decide1/Balance/
-- Decide2 phases) to online play. Previously `play_move` always alternated Black/White by move
-- parity from move 0, so `opening_rule = 'swap2'` was stored but never actually enforced online.

create type game_phase as enum ('opening', 'decide1', 'balance', 'decide2', 'playing');
create type swap_decision as enum ('keep', 'swap');

alter table games add column phase game_phase not null default 'playing';

-- create_game: swap2 games start in 'opening' with the clock NOT running yet — chess-clock
-- semantics only apply once real play begins (decide_opening starts it on the decide1/decide2
-- transition to 'playing'); standard games skip straight to 'playing' with the clock running
-- immediately, exactly as before.
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
	v_phase game_phase;
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

	v_bank_ms := p_time_control::text::int * 60000;
	v_phase := case when p_opening_rule = 'swap2' then 'opening' else 'playing' end;

	insert into games (
		kind, table_id, opening_rule, time_control, status, phase,
		player1_id, player2_id, player1_name, player2_name,
		player1_clock_ms, player2_clock_ms, started_at, clock_running_since
	) values (
		p_kind, p_table_id, p_opening_rule, p_time_control, 'active', v_phase,
		v_caller, p_opponent_id, v_caller_name, v_opponent_name,
		v_bank_ms, v_bank_ms,
		case when v_phase = 'playing' then now() else null end,
		case when v_phase = 'playing' then now() else null end
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

	v_bank_ms := p_time_control::text::int * 60000;

	insert into games (
		kind, table_id, opening_rule, time_control, status, phase,
		player1_id, player2_id, player1_name, player2_name,
		player1_clock_ms, player2_clock_ms, started_at, clock_running_since
	) values (
		'room', p_table_id, 'swap2', p_time_control, 'active', 'opening',
		v_other_seat.player_id, v_caller,
		(select display_name from profiles where id = v_other_seat.player_id), v_caller_name,
		v_bank_ms, v_bank_ms, null, null
	)
	returning * into v_game;

	insert into room_seats (table_id, seat, player_id, game_id) values (p_table_id, 2, v_caller, v_game.id);
	update room_seats set game_id = v_game.id where table_id = p_table_id and seat = 1;

	return v_game;
end;
$$;

-- Human equivalent of Game.svelte.ts's decide(): resolves the decide1 (Player2) or decide2
-- (Player1) swap decision, ports assignSeatColor's swapped formula, and starts the clock — this is
-- the moment real play begins, matching Board.svelte's untimed Opening/Decide/Balance phases.
create or replace function decide_opening(p_game_id text, p_choice swap_decision)
returns games
language plpgsql
security definer
set search_path = public
as $$
declare
	v_game games%rowtype;
	v_caller uuid := auth.uid();
	v_move_count int;
	v_next_color seat_color;
	v_chosen_color seat_color;
	v_expected_player uuid;
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
	if v_game.phase not in ('decide1', 'decide2') then
		raise exception 'no swap decision pending';
	end if;

	v_expected_player := case when v_game.phase = 'decide1' then v_game.player2_id else v_game.player1_id end;
	if v_expected_player is distinct from v_caller then
		raise exception 'not your decision';
	end if;

	select count(*) into v_move_count from moves where game_id = p_game_id;
	v_next_color := case when v_move_count % 2 = 0 then 'Black' else 'White' end;
	v_chosen_color := case
		when p_choice = 'keep' then v_next_color
		else (case when v_next_color = 'Black' then 'White' else 'Black' end)
	end;

	-- Mirrors assignSeatColor(seat, color): Player1 swapped iff they end up White,
	-- Player2 (decider at decide1) swapped iff they end up Black.
	v_game.swapped := case
		when v_game.phase = 'decide1' then v_chosen_color = 'Black'
		else v_chosen_color = 'White'
	end;
	v_game.phase := 'playing';
	v_game.clock_running_since := now();
	v_game.started_at := coalesce(v_game.started_at, now());

	update games set
		swapped = v_game.swapped,
		phase = v_game.phase,
		clock_running_since = v_game.clock_running_since,
		started_at = v_game.started_at
	where id = p_game_id;

	return v_game;
end;
$$;

-- Human equivalent of Game.svelte.ts's placeTwoMore(): decide1 responder opts to place 2 more
-- neutral stones instead of deciding immediately.
create or replace function place_two_more(p_game_id text)
returns games
language plpgsql
security definer
set search_path = public
as $$
declare
	v_game games%rowtype;
	v_caller uuid := auth.uid();
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
	if v_game.phase <> 'decide1' then
		raise exception 'not awaiting the decide1 decision';
	end if;
	if v_game.player2_id is distinct from v_caller then
		raise exception 'not your decision';
	end if;

	v_game.phase := 'balance';
	update games set phase = v_game.phase where id = p_game_id;

	return v_game;
end;
$$;

-- Phase-aware rewrite: Opening (Player1, 3 stones) and Balance (Player2, 2 stones) place neutral
-- stones by fixed seat, untimed, with no win check (matches Board.svelte's humanPlay, which only
-- calls finishTurn — the win/draw check — from the Playing phase). decide1/decide2 must go through
-- decide_opening instead of play_move. 'playing' keeps the original swapped+parity turn logic,
-- clock deduction, and win/draw check unchanged.
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
	if v_game.phase in ('decide1', 'decide2') then
		raise exception 'awaiting swap decision';
	end if;

	select count(*) into v_move_number from moves where game_id = p_game_id;

	if v_game.phase = 'opening' then
		v_expected_player := v_game.player1_id;
	elsif v_game.phase = 'balance' then
		v_expected_player := v_game.player2_id;
	else
		v_seat_color := case when v_move_number % 2 = 0 then 'Black' else 'White' end;
		if (v_seat_color = 'Black') = not v_game.swapped then
			v_expected_player := v_game.player1_id;
		else
			v_expected_player := v_game.player2_id;
		end if;
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

	if v_game.phase = 'opening' then
		insert into moves (game_id, move_number, coordinate, player_id)
		values (p_game_id, v_move_number, p_coordinate, v_caller);
		if v_move_number + 1 >= 3 then
			v_game.phase := 'decide1';
			update games set phase = v_game.phase where id = p_game_id;
		end if;
		return v_game;
	end if;

	if v_game.phase = 'balance' then
		insert into moves (game_id, move_number, coordinate, player_id)
		values (p_game_id, v_move_number, p_coordinate, v_caller);
		if v_move_number + 1 >= 5 then
			v_game.phase := 'decide2';
			update games set phase = v_game.phase where id = p_game_id;
		end if;
		return v_game;
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
