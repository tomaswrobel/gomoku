import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "$lib/supabase/database.types";

/// Joins a Presence channel for live spectator counts on a table; no schema, purely ephemeral.
/// Returns an unsubscribe function. `onCount` fires whenever the number of present clients changes.
export function spectateTable(
	supabase: SupabaseClient<Database>,
	tableId: number,
	onCount: (count: number) => void,
): () => void {
	const channel = supabase.channel(`table-presence:${tableId}`, {
		config: { presence: { key: crypto.randomUUID() } },
	});

	channel
		.on("presence", { event: "sync" }, () => {
			const state = channel.presenceState();
			onCount(Object.keys(state).length);
		})
		.subscribe((status) => {
			if (status === "SUBSCRIBED") {
				void channel.track({ online_at: new Date().toISOString() });
			}
		});

	return () => void supabase.removeChannel(channel);
}
