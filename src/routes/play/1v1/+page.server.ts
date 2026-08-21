import { requireSession } from "$lib/auth/session";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	const session = requireSession(event);

	const { data: opponents } = await event.locals.supabase
		.from("profiles")
		.select("id, display_name")
		.neq("id", session.user.id)
		.order("display_name");

	return { opponents: opponents ?? [] };
};
