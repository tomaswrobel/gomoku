import { env } from "$env/dynamic/private";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = ({ locals }) => {
	return {
		session: locals.session,
		locale: locals.locale,
		supabaseUrl: env.SUPABASE_URL!,
		supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY!,
	};
};
