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
		}
		// interface Error {}
		// interface Platform {}
	}
}

export {};
