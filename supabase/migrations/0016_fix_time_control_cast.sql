-- Postgres enums can't be cast directly to int (error 42846); go through text first.
-- Fixes create_game/sit_at_table's clock-bank calculation from 0013_functions_play_move.sql.

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

	v_bank_ms := p_time_control::text::int * 60000;

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

	v_bank_ms := p_time_control::text::int * 60000;

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
