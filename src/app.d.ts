import type { SupabaseClient, Session } from "@supabase/supabase-js";
import type { Locale } from "$lib/i18n/Locale.ts";
import type { Database } from "$lib/supabase/database.types";

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			getSession(): Promise<Session | null>;
			session: Session | null;
			locale: Locale;
		}
		interface PageData {
			session: Session | null;
			locale: Locale;
			// Only guaranteed once the root `+layout.ts` universal load has run (it always does,
			// before any page renders) — optional here because `+page.server.ts` loads run before
			// it and can't type-check against data they don't themselves produce.
			supabaseUrl?: string;
			supabasePublishableKey?: string;
			supabase?: SupabaseClient<Database>;
		}
		// interface Error {}
		// interface Platform {}
	}
}

export {};
