import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const { data: tables } = await locals.supabase.from("tables").select("id, label").order("id");
	const { data: seats } = await locals.supabase.from("room_seats").select("*");

	return {
		tables: (tables ?? []).map((table) => ({
			...table,
			seats: (seats ?? []).filter((seat) => seat.table_id === table.id),
		})),
	};
};
