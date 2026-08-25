import type { SupabaseClient } from "@supabase/supabase-js";
import { Board } from "$lib/game/Board.svelte";
import { checkFiveInRow } from "$lib/game/checkFiveInRow.ts";
import { Color } from "$lib/game/Color.ts";
import { colorAtMove } from "$lib/game/colorAtMove.ts";
import type { Coordinate } from "$lib/game/coordinate/Coordinate.ts";
import { OppositeSeat, Seat } from "$lib/game/Seat.ts";
import { playRemoteMove } from "./playRemoteMove.ts";
import { subscribeToGame } from "./subscribeToGame.ts";
import type { Database } from "$lib/supabase/database.types";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

/// Server-authoritative sibling of Game.svelte.ts for online play: reuses Board.svelte.ts
/// unchanged for the move list/derived board/replay, but never decides game state itself — every
/// field here is corrected by the next Postgres Changes event. `checkFiveInRow`/`colorAtMove` are
/// only used for optimistic/cosmetic client feedback between the local click and the server ack.
export class RemoteGame {
	public readonly board: Board;
	public readonly gameId: string;
	public readonly viewerId: string | null;

	public status = $state<GameRow["status"]>("waiting");
	public swapped = $state(false);
	public winnerColor = $state<GameRow["winner_color"]>(null);
	public player1ClockMs = $state(0);
	public player2ClockMs = $state(0);
	public clockRunningSince = $state<string | null>(null);
	public player1Name = $state("");
	public player2Name = $state("");
	public player1Id = $state<string | null>(null);
	public player2Id = $state<string | null>(null);

	private unsubscribe: (() => void) | null = null;

	public constructor(
		private readonly supabase: SupabaseClient<Database>,
		initial: GameRow,
		moves: Coordinate[],
		viewerId: string | null,
	) {
		this.gameId = initial.id;
		this.viewerId = viewerId;
		this.board = new Board(moves);
		this.applyRow(initial);
	}

	public readonly nextColor: Color = $derived.by(() => colorAtMove(this.board.moves.length));

	public readonly viewerSeat: Seat | null = $derived.by(() => {
		if (this.viewerId === this.player1Id) {
			return Seat.Player1;
		}
		if (this.viewerId === this.player2Id) {
			return Seat.Player2;
		}
		return null;
	});

	public readonly viewerColor: Color | null = $derived.by(() => {
		const seat = this.viewerSeat;
		if (!seat) {
			return null;
		}
		const base: Color = seat === Seat.Player1 ? Color.Black : Color.White;
		return this.swapped ? (base === Color.Black ? Color.White : Color.Black) : base;
	});

	public readonly canMove: boolean = $derived.by(
		() => this.status === "active" && this.viewerColor === this.nextColor,
	);

	public subscribe(): void {
		this.unsubscribe = subscribeToGame(this.supabase, this.gameId, {
			onGameUpdate: (row) => this.applyRow(row),
			onMoveInsert: (move) => {
				const coordinate = move.coordinate as Coordinate;
				if (this.board.moves[move.move_number] === undefined) {
					this.board.play(coordinate);
				}
			},
		});
	}

	public destroy(): void {
		this.unsubscribe?.();
		this.unsubscribe = null;
	}

	private applyRow(row: GameRow): void {
		this.status = row.status;
		this.swapped = row.swapped;
		this.winnerColor = row.winner_color;
		this.player1ClockMs = row.player1_clock_ms;
		this.player2ClockMs = row.player2_clock_ms;
		this.clockRunningSince = row.clock_running_since;
		this.player1Name = row.player1_name;
		this.player2Name = row.player2_name;
		this.player1Id = row.player1_id;
		this.player2Id = row.player2_id;
	}

	/// Called from the board UI on click; optimistically appends the move (undone on any mismatch
	/// with the next Postgres Changes event, since applyRow/the moves subscription is the source
	/// of truth) then submits it through the play_move RPC.
	public async play(coordinate: Coordinate): Promise<void> {
		if (!this.canMove || this.board.board[coordinate]) {
			return;
		}
		this.board.play(coordinate);
		try {
			await playRemoteMove(this.supabase, this.gameId, coordinate);
		} catch {
			this.board.undo();
		}
	}

	/// Cosmetic-only optimistic win check; the server's `check_five_in_row` port is authoritative.
	public checkOptimisticWin(): boolean {
		const last = this.board.moves[this.board.moves.length - 1];
		return last !== undefined && checkFiveInRow(this.board.board, last, false);
	}

	public seatFor(color: Color): Seat {
		const base: Seat = color === Color.Black ? Seat.Player1 : Seat.Player2;
		return this.swapped ? OppositeSeat[base] : base;
	}
}
