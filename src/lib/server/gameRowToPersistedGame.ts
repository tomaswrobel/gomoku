import type { Color } from "$lib/game/Color";
import { Controller } from "$lib/game/Controller";
import type { Coordinate } from "$lib/game/coordinate/Coordinate";
import { OpeningRule } from "$lib/game/OpeningRule";
import type { PersistedGame } from "$lib/game/PersistedGame";
import { Phase } from "$lib/game/Phase";
import { Seat } from "$lib/game/Seat";
import type { Database } from "$lib/supabase/database.types";

type GameRow = Database["public"]["Tables"]["games"]["Row"];
type MoveRow = Database["public"]["Tables"]["moves"]["Row"];

/// Maps a `games` row + its ordered `moves` rows into the same `PersistedGame` shape the local
/// client game state machine already understands, so `Board.svelte.ts`/`Game.svelte.ts` need no
/// changes to render a remote game read-only (e.g. a finished `/game/[id]` replay).
export function gameRowToPersistedGame(game: GameRow, moves: MoveRow[]): PersistedGame {
	return {
		controllers: {
			[Seat.Player1]: Controller.Remote,
			[Seat.Player2]: Controller.Remote,
		},
		swapped: game.swapped,
		phase:
			game.status === "finished" || game.status === "aborted"
				? Phase.Finished
				: Phase.Playing,
		winner: game.result === "win" && game.winner_color ? (game.winner_color as Color) : null,
		moves: moves
			.slice()
			.sort((a, b) => a.move_number - b.move_number)
			.map((move) => move.coordinate as Coordinate),
		openingRule: game.opening_rule === "swap2" ? OpeningRule.Swap2 : OpeningRule.Standard,
	};
}
