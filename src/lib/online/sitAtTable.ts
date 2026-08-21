import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TimeControl } from "$lib/supabase/database.types";

export async function sitAtTable(
	supabase: SupabaseClient<Database>,
	tableId: number,
	timeControl: TimeControl,
) {
	const { data, error } = await supabase.rpc("sit_at_table", {
		p_table_id: tableId,
		p_time_control: timeControl,
	});
	if (error) {
		throw error;
	}
	return data;
}
