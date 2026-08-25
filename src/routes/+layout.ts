import { createSupabaseBrowserClient } from "$lib/supabase/client.ts";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ data }) => {
	const supabase = createSupabaseBrowserClient(data.supabaseUrl, data.supabasePublishableKey);
	return {
		...data,
		supabase,
	};
};
