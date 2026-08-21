import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "$lib/supabase/database.types";

export async function leaveTable(supabase: SupabaseClient<Database>, tableId: number) {
	const { error } = await supabase.rpc("leave_table", { p_table_id: tableId });
	if (error) {
		throw error;
	}
}
