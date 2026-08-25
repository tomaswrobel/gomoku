import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "$lib/supabase/database.types";

export interface TableSummary {
	id: number;
	label: string;
	seats: Database["public"]["Tables"]["room_seats"]["Row"][];
}

export async function listOpenTables(supabase: SupabaseClient<Database>): Promise<TableSummary[]> {
	const [{ data: tables, error: tablesError }, { data: seats, error: seatsError }] =
		await Promise.all([
			supabase.from("tables").select("id, label").order("id"),
			supabase.from("room_seats").select("*"),
		]);
	if (tablesError) {
		throw tablesError;
	}
	if (seatsError) {
		throw seatsError;
	}

	return (tables ?? []).map((table) => ({
		...table,
		seats: (seats ?? []).filter((seat) => seat.table_id === table.id),
	}));
}
