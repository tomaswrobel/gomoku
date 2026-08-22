import { error } from "@sveltejs/kit";
import { gameRowToPersistedGame } from "$lib/server/gameRowToPersistedGame.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const { data: game, error: gameError } = await locals.supabase
		.from("games")
		.select("*")
		.eq("id", params.id)
		.single();

	if (gameError || !game) {
		error(404, "Game not found");
	}

	const { data: moves } = await locals.supabase
		.from("moves")
		.select("*")
		.eq("game_id", params.id)
		.order("move_number");

	return {
		game,
		persistedGame: gameRowToPersistedGame(game, moves ?? []),
		viewerId: locals.session?.user.id ?? null,
	};
};
