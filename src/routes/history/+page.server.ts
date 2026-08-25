import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) {
		return { onlineGames: null };
	}

	const userId = locals.session.user.id;
	const { data } = await locals.supabase
		.from("games")
		.select("id, kind, status, result, player1_name, player2_name, finished_at")
		.or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
		.order("created_at", { ascending: false })
		.limit(50);

	return { onlineGames: data ?? [] };
};
