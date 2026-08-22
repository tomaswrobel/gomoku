import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/// Browser Supabase client, for use in `.svelte` components: reactive UI + Realtime subscriptions.
/// `url`/`publishableKey` come from root layout data (see `+layout.server.ts`) rather than
/// `$env/static/public`, since the Vercel Supabase integration doesn't use the `PUBLIC_` prefix.
/// Call once, in `+layout.ts` — every route reuses that single instance via `data.supabase`.
export function createSupabaseBrowserClient(url: string, publishableKey: string) {
	return createBrowserClient<Database>(url, publishableKey);
}
