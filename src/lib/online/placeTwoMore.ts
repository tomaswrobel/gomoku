import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "$lib/supabase/database.types";

export async function placeTwoMore(supabase: SupabaseClient<Database>, gameId: string) {
	const { data, error } = await supabase.rpc("place_two_more", {
		p_game_id: gameId,
	});
	if (error) {
		throw error;
	}
	return data;
}
