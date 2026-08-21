import { error, type RequestEvent } from "@sveltejs/kit";
import type { Session } from "@supabase/supabase-js";

export function getSession(event: RequestEvent): Session | null {
	return event.locals.session;
}

/// Throws a 401 if there's no signed-in session; use in `+page.server.ts`/`+server.ts` handlers
/// that require auth (online play, sitting at a table, submitting a move).
export function requireSession(event: RequestEvent): Session {
	const session = event.locals.session;
	if (!session) {
		error(401, "Sign in with Discord to continue.");
	}
	return session;
}
