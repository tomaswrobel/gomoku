import { createSupabaseBrowserClient } from "$lib/supabase/client";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ data }) => {
	const supabase = createSupabaseBrowserClient();
	return {
		...data,
		supabase,
	};
};
