import { createServerClient } from "@supabase/ssr";
import { env } from "$env/dynamic/private";
import type { RequestEvent } from "@sveltejs/kit";
import type { Database } from "./database.types";

/// Per-request Supabase client for `hooks.server.ts` and `+page.server.ts`/`+layout.server.ts`
/// load functions: reads/writes the auth session via cookies on `event`.
export function createSupabaseServerClient(event: RequestEvent) {
	return createServerClient<Database>(env.SUPABASE_URL!, env.SUPABASE_PUBLISHABLE_KEY!, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				for (const { name, value, options } of cookiesToSet) {
					event.cookies.set(name, value, { ...options, path: options?.path ?? "/" });
				}
			},
		},
	});
}
