import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SwapDecision } from "$lib/supabase/database.types";

export async function decideOpening(
	supabase: SupabaseClient<Database>,
	gameId: string,
	choice: SwapDecision,
) {
	const { data, error } = await supabase.rpc("decide_opening", {
		p_game_id: gameId,
		p_choice: choice,
	});
	if (error) {
		throw error;
	}
	return data;
}
