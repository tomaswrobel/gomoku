import { Board } from "./Board.svelte";
import { Color, oppositeColor } from "./Color";
import { Controller } from "./Controller";
import type { Coordinate } from "./coordinate/Coordinate";
import { Decision } from "./Decision";
import { fromProtocol } from "./coordinate/fromProtocol";
import { fromProtocolList } from "./coordinate/fromProtocolList";
import { RapfiEngine } from "./engine/RapfiEngine";
import { toProtocol } from "./coordinate/toProtocol";
import { Phase } from "./Phase";
import type { PersistedGame } from "./PersistedGame";
import { oppositeSeat, Seat } from "./Seat";
import { boardSize } from "./boardSize";
import { checkFiveInRow } from "./checkFiveInRow";
import { difficultyTurnTime } from "./difficultyTurnTime";
import { Settings } from "./settings";
import { assert } from "@juvofy/lib/utils/assert";

/// Orchestrates a full game locked to the Gomoku Swap2 opening rule: the "black" seat always
/// proposes the opening (3 stones), the "white" seat decides whether to swap, play on, or place
/// 2 more balancing stones (in which case "black" makes the final swap/play decision). Each seat is
/// independently controlled by a human (mouse clicks) or a Rapfi engine instance (Gomocup protocol).
export class SwapTwoGame {
	readonly board: Board;

	controllers = $state<Record<Seat, Controller>>({
		[Seat.Player1]: Controller.Human,
		[Seat.Player2]: Controller.Human,
	});
	swapped = $state(false);
	phase = $state<Phase>(Phase.Opening);
	thinking = $state(false);
	winner = $state<Color | null>(null);

	private readonly enginePromises = new Map<Seat, Promise<RapfiEngine>>();
	private started = false;

	constructor(moves: Coordinate[] = []) {
		this.board = new Board(moves);
	}

	/// Reconstructs a game from a previously-persisted snapshot; call `resume()` (not `start()`)
	/// afterwards to pick play back up, since the opening has already happened.
	static restore(data: PersistedGame): SwapTwoGame {
		const game = new SwapTwoGame(data.moves);
		game.controllers = data.controllers;
		game.swapped = data.swapped;
		game.phase = data.phase;
		game.winner = data.winner;
		return game;
	}

	toJSON(): PersistedGame {
		return {
			controllers: this.controllers,
			swapped: this.swapped,
			phase: this.phase,
			winner: this.winner,
			moves: this.board.moves,
		};
	}

	seatFor(color: Color): Seat {
		const base: Seat = color === Color.Black ? Seat.Player1 : Seat.Player2;
		return this.swapped ? oppositeSeat(base) : base;
	}

	controllerFor(color: Color): Controller {
		return this.controllers[this.seatFor(color)];
	}

	get nextColor(): Color {
		return this.colorOf(this.board.moves.length);
	}

	private colorOf(moveIndex: number): Color {
		return moveIndex % 2 ? Color.White : Color.Black;
	}

	get nextController(): Controller {
		return this.controllerFor(this.nextColor);
	}

	get decisionSeat(): Seat | null {
		if (this.phase === Phase.Decide1) return Seat.Player2;
		if (this.phase === Phase.Decide2) return Seat.Player1;
		return null;
	}

	async start(): Promise<void> {
		if (this.started) return;
		this.started = true;
		this.initEngines();
		this.phase = Phase.Opening;
		await this.advance();
	}

	/// Picks a game back up from a `SwapTwoGame.restore()` snapshot: same engine setup as `start()`,
	/// but keeps whatever phase/moves were restored instead of resetting to a fresh opening.
	async resume(): Promise<void> {
		if (this.started) return;
		this.started = true;
		this.initEngines();
		await this.advance();
	}

	private initEngines(): void {
		for (const seat of [Seat.Player1, Seat.Player2]) {
			if (this.controllers[seat] === Controller.Computer) {
				this.enginePromises.set(seat, this.createEngine());
			}
		}
	}

	private async createEngine(): Promise<RapfiEngine> {
		const engine = new RapfiEngine();
		await engine.init(boardSize, difficultyTurnTime(Settings.value.difficulty));
		return engine;
	}

	destroy(): void {
		for (const enginePromise of this.enginePromises.values()) {
			void enginePromise.then((engine) => engine.terminate());
		}
		this.enginePromises.clear();
	}

	/** Called from the board UI when a human clicks an empty cell. */
	humanPlay(coordinate: Coordinate): void {
		if (this.thinking || this.board.board[coordinate]) {
			return;
		}

		if (this.phase === Phase.Opening && this.controllers[Seat.Player1] === Controller.Human) {
			this.board.play(coordinate);
			if (this.board.moves.length >= 3) {
				this.phase = Phase.Decide1;
				void this.advance();
			}
			return;
		}

		if (this.phase === Phase.Balance && this.controllers[Seat.Player2] === Controller.Human) {
			this.board.play(coordinate);
			if (this.board.moves.length >= 5) {
				this.phase = Phase.Decide2;
				void this.advance();
			}
			return;
		}

		if (this.phase === Phase.Playing && this.nextController === Controller.Human) {
			this.board.play(coordinate);
			this.finishTurn();
		}
	}

	/** Called from the UI when the human decider chooses to keep or swap colors. */
	decide(choice: Decision): void {
		const decider = this.decisionSeat;
		if (!decider || this.controllers[decider] !== Controller.Human) {
			return;
		}
		const nextColor = this.nextColor;
		this.assignSeatColor(
			decider,
			choice === Decision.Swap ? oppositeColor(nextColor) : nextColor,
		);
		this.phase = Phase.Playing;
		void this.advance();
	}

	/** Only available to the human responder at decide1: place 2 more neutral stones. */
	placeTwoMore(): void {
		if (this.phase !== Phase.Decide1 || this.controllers[Seat.Player2] !== Controller.Human)
			return;
		this.phase = Phase.Balance;
	}

	private assignSeatColor(seat: Seat, color: Color) {
		this.swapped = seat === Seat.Player1 ? color === Color.White : color === Color.Black;
	}

	private engineFor(seat: Seat): Promise<RapfiEngine> {
		const enginePromise = this.enginePromises.get(seat);
		assert(enginePromise, `No engine registered for seat "${seat}"`);
		return enginePromise;
	}

	private finishTurn() {
		const last = this.board.moves[this.board.moves.length - 1];
		if (last && checkFiveInRow(this.board.board, last, Settings.value.overlineWins)) {
			this.winner = this.board.board[last]!;
			this.phase = Phase.Finished;
		} else if (this.board.moves.length >= boardSize ** 2) {
			this.phase = Phase.Finished;
		} else {
			void this.advance();
		}
	}

	/** Triggers whatever computer action the current phase/turn calls for; no-op for human turns. */
	private async advance(): Promise<void> {
		if (this.phase === Phase.Opening) {
			if (this.controllers[Seat.Player1] === Controller.Computer) {
				await this.runOpening();
			}
		} else if (this.phase === Phase.Decide1 || this.phase === Phase.Decide2) {
			const decider: Seat = this.phase === Phase.Decide1 ? Seat.Player2 : Seat.Player1;
			if (this.controllers[decider] === Controller.Computer) {
				await this.runDecision(decider);
			}
		} else if (this.phase === Phase.Playing && this.nextController === Controller.Computer) {
			await this.runMove(this.seatFor(this.nextColor));
		}
	}

	private async runOpening() {
		this.thinking = true;
		try {
			const engine = await this.engineFor(Seat.Player1);
			const reply = await engine.proposeOpening();
			fromProtocolList(reply).forEach(this.board.play, this.board);
		} finally {
			this.thinking = false;
		}

		if (this.board.moves.length >= 3) {
			this.phase = Phase.Decide1;
			await this.advance();
		}
	}

	private async runDecision(decider: Seat) {
		this.thinking = true;
		try {
			const position = this.board.moves.map(
				(c, i) => `${toProtocol(c)},${decider === Seat.Player1 && i < 3 ? 1 : 2}`,
			);
			const engine = await this.engineFor(decider);
			const reply = await engine.decideSwap(position);

			const nextColor = this.nextColor;
			if (reply === "SWAP") {
				this.assignSeatColor(decider, oppositeColor(nextColor));
			} else {
				this.assignSeatColor(decider, nextColor);
				this.board.play(fromProtocol(reply));
			}
		} finally {
			this.thinking = false;
		}

		this.phase = Phase.Playing;
		this.finishTurn();
	}

	private async runMove(seat: Seat) {
		this.thinking = true;
		try {
			const position = this.board.moves.map(
				(c, i) => `${toProtocol(c)},${this.seatFor(this.colorOf(i)) === seat ? 1 : 2}`,
			);
			const engine = await this.engineFor(seat);
			const reply = await engine.nextMove(position);
			this.board.play(fromProtocol(reply));
		} finally {
			this.thinking = false;
		}

		this.finishTurn();
	}
}
