import { createClient } from "@supabase/supabase-js";
import { env } from "$env/dynamic/private";
import type { Database } from "../supabase/database.types";

// SERVER-ONLY. This client bypasses Row Level Security with the secret key. Never import
// this module from a `.svelte` file or anything that ends up in a client bundle — it lives under
// `src/lib/server/`, which SvelteKit refuses to bundle for the client, precisely so misuse fails
// the build instead of leaking the key.
export const supabaseAdmin = createClient<Database>(env.SUPABASE_URL!, env.SUPABASE_SECRET_KEY!, {
	auth: { autoRefreshToken: false, persistSession: false },
});
