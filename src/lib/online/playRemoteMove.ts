import type { SupabaseClient } from "@supabase/supabase-js";
import type { Coordinate } from "$lib/game/coordinate/Coordinate";
import type { Database } from "$lib/supabase/database.types";

export async function playRemoteMove(
	supabase: SupabaseClient<Database>,
	gameId: string,
	coordinate: Coordinate,
) {
	const { data, error } = await supabase.rpc("play_move", {
		p_game_id: gameId,
		p_coordinate: coordinate,
	});
	if (error) {
		throw error;
	}
	return data;
}
