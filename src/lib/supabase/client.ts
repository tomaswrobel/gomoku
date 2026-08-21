import { createBrowserClient } from "@supabase/ssr";
import { env } from "$env/dynamic/public";
import type { Database } from "./database.types";

/// Browser Supabase client, for use in `.svelte` components: reactive UI + Realtime subscriptions.
export function createSupabaseBrowserClient() {
	return createBrowserClient<Database>(env.PUBLIC_SUPABASE_URL!, env.PUBLIC_SUPABASE_ANON_KEY!);
}
