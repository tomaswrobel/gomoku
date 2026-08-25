create or replace function remaining_clock_ms(p_game games, p_color seat_color)
returns int
language plpgsql
stable
as $$
declare
	v_is_player1 boolean;
	v_bank int;
	v_elapsed_ms int;
	v_mover_color seat_color;
begin
	v_is_player1 := (p_color = 'Black') = not p_game.swapped;
	v_bank := case when v_is_player1 then p_game.player1_clock_ms else p_game.player2_clock_ms end;

	if p_game.status <> 'active' or p_game.clock_running_since is null then
		return v_bank;
	end if;

	select case when count(*) % 2 = 0 then 'Black' else 'White' end into v_mover_color
	from moves
	where game_id = p_game.id;

	if v_mover_color <> p_color then
		return v_bank;
	end if;

	v_elapsed_ms := greatest(
		0,
		floor(extract(epoch from (now() - p_game.clock_running_since)) * 1000)
	)::int;

	return greatest(0, v_bank - v_elapsed_ms);
end;
$$;

-- Clients call this once their cosmetic local countdown reaches zero, so the server can
-- authoritatively confirm (or reject, if a move landed just in time) the flag-fall.
create or replace function check_flag(p_game_id text)
returns games
language plpgsql
security definer
set search_path = public
as $$
declare
	v_game games%rowtype;
	v_mover_color seat_color;
	v_remaining int;
begin
	select * into v_game from games where id = p_game_id for update;
	if not found then
		raise exception 'game not found';
	end if;

	if v_game.status <> 'active' or v_game.clock_running_since is null then
		return v_game;
	end if;

	select case when count(*) % 2 = 0 then 'Black' else 'White' end into v_mover_color
	from moves
	where game_id = p_game_id;

	v_remaining := remaining_clock_ms(v_game, v_mover_color);
	if v_remaining > 0 then
		return v_game;
	end if;

	update games set
		status = 'finished',
		result = 'win',
		winner_color = case when v_mover_color = 'Black' then 'White' else 'Black' end,
		player1_clock_ms = case when (v_mover_color = 'Black') = not v_game.swapped then 0 else v_game.player1_clock_ms end,
		player2_clock_ms = case when (v_mover_color = 'White') = not v_game.swapped then 0 else v_game.player2_clock_ms end,
		finished_at = now(),
		clock_running_since = null
	where id = p_game_id
	returning * into v_game;

	return v_game;
end;
$$;
