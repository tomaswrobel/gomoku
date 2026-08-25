import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "$lib/supabase/database.types";

type GameRow = Database["public"]["Tables"]["games"]["Row"];
type MoveRow = Database["public"]["Tables"]["moves"]["Row"];

interface SubscribeHandlers {
	onGameUpdate(game: GameRow): void;
	onMoveInsert(move: MoveRow): void;
}

/// Centralizes the games-UPDATE + moves-INSERT Postgres Changes subscription for a single game.
/// Returns an unsubscribe function.
export function subscribeToGame(
	supabase: SupabaseClient<Database>,
	gameId: string,
	handlers: SubscribeHandlers,
): () => void {
	const channel = supabase
		.channel(`game:${gameId}`)
		.on(
			"postgres_changes",
			{ event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
			(payload) => handlers.onGameUpdate(payload.new as GameRow),
		)
		.on(
			"postgres_changes",
			{ event: "INSERT", schema: "public", table: "moves", filter: `game_id=eq.${gameId}` },
			(payload) => handlers.onMoveInsert(payload.new as MoveRow),
		)
		.subscribe();

	return () => void supabase.removeChannel(channel);
}
