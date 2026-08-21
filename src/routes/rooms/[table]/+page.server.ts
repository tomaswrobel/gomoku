import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const tableId = Number(params.table);
	if (!Number.isInteger(tableId) || tableId < 1 || tableId > 5) {
		error(404, "Table not found");
	}

	const { data: seats } = await locals.supabase
		.from("room_seats")
		.select("*")
		.eq("table_id", tableId);

	const activeGameId = seats?.find((seat) => seat.game_id)?.game_id ?? null;

	return {
		tableId,
		seats: seats ?? [],
		activeGameId,
		session: locals.session,
	};
};
