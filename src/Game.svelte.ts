import { Board } from "./Board.svelte";
import { Color } from "./Color";
import { Controller } from "./Controller";
import type { Coordinate } from "./Coordinate";
import { Decision } from "./Decision";
import { fromProtocol } from "./engine/fromProtocol";
import { fromProtocolList } from "./engine/fromProtocolList";
import { RapfiEngine } from "./engine/RapfiEngine";
import { toProtocol } from "./engine/toProtocol";
import { Horizontal } from "./Horizontal";
import { Phase } from "./Phase";
import type { PersistedGame } from "./PersistedGame";
import { Seat } from "./Seat";

const BOARD_SIZE = Horizontal.length;
const TURN_TIME_MS = 5000;

function otherSeat(seat: Seat): Seat {
	return seat === Seat.Black ? Seat.White : Seat.Black;
}

function otherColor(color: Color): Color {
	return color === Color.Black ? Color.White : Color.Black;
}

function colorOf(moveIndex: number): Color {
	return moveIndex % 2 ? Color.White : Color.Black;
}

/// Tags (true = placed by the decider) for the neutral Swap2 opening stones, seen from `decider`'s
/// point of view. The first 3 stones are always placed by the opener (black seat); any further 2
/// stones (reachable only when a human responder chooses to "place 2 more") are placed by the
/// responder (white seat). Ownership of these stones is only settled once a decision is made.
function decisionTags(decider: Seat, moveCount: number): boolean[] {
	return Array.from(
		{ length: moveCount },
		decider === Seat.White ? () => false : (_, i) => i < 3,
	);
}

const DIRECTIONS: [number, number][] = [
	[1, 0],
	[0, 1],
	[1, 1],
	[1, -1],
];

function checkFiveInRow(board: Partial<Record<Coordinate, Color>>, last: Coordinate): boolean {
	const color = board[last];
	if (!color) return false;

	const x0 = Horizontal.indexOf(last[0] as (typeof Horizontal)[number]);
	const y0 = Number(last.slice(1)) - 1;

	for (const [dx, dy] of DIRECTIONS) {
		let count = 1;
		for (const sign of [-1, 1]) {
			let x = x0 + dx * sign;
			let y = y0 + dy * sign;
			while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
				const coordinate = `${Horizontal[x]}${y + 1}` as Coordinate;
				if (board[coordinate] !== color) break;
				count++;
				x += dx * sign;
				y += dy * sign;
			}
		}
		if (count >= 5) return true;
	}
	return false;
}

/// Orchestrates a full game locked to the Gomoku Swap2 opening rule: the "black" seat always
/// proposes the opening (3 stones), the "white" seat decides whether to swap, play on, or place
/// 2 more balancing stones (in which case "black" makes the final swap/play decision). Each seat is
/// independently controlled by a human (mouse clicks) or a Rapfi engine instance (Gomocup protocol).
export class SwapTwoGame {
	readonly board: Board;

	controllers = $state<Record<Seat, Controller>>({
		[Seat.Black]: Controller.Human,
		[Seat.White]: Controller.Human,
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
		const base: Seat = color === Color.Black ? Seat.Black : Seat.White;
		return this.swapped ? otherSeat(base) : base;
	}

	controllerFor(color: Color): Controller {
		return this.controllers[this.seatFor(color)];
	}

	get nextColor(): Color {
		return colorOf(this.board.moves.length);
	}

	get nextController(): Controller {
		return this.controllerFor(this.nextColor);
	}

	get decisionSeat(): Seat | null {
		if (this.phase === Phase.Decide1) return Seat.White;
		if (this.phase === Phase.Decide2) return Seat.Black;
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
		for (const seat of [Seat.Black, Seat.White]) {
			if (this.controllers[seat] === Controller.Computer) {
				this.enginePromises.set(seat, this.createEngine());
			}
		}
	}

	private async createEngine(): Promise<RapfiEngine> {
		const engine = new RapfiEngine();
		await engine.init(BOARD_SIZE, TURN_TIME_MS);
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
		if (this.thinking || this.board.board[coordinate]) return;

		if (this.phase === Phase.Opening) {
			if (this.controllers[Seat.Black] !== Controller.Human) return;
			this.board.play(coordinate);
			if (this.board.moves.length >= 3) {
				this.phase = Phase.Decide1;
				void this.advance();
			}
			return;
		}

		if (this.phase === Phase.Balance) {
			if (this.controllers[Seat.White] !== Controller.Human) return;
			this.board.play(coordinate);
			if (this.board.moves.length >= 5) {
				this.phase = Phase.Decide2;
				void this.advance();
			}
			return;
		}

		if (this.phase === Phase.Playing) {
			if (this.nextController !== Controller.Human) return;
			this.board.play(coordinate);
			this.finishTurn();
		}
	}

	/** Called from the UI when the human decider chooses to keep or swap colors. */
	decide(choice: Decision): void {
		const decider = this.decisionSeat;
		if (!decider || this.controllers[decider] !== Controller.Human) return;

		const nextColor = this.nextColor;
		this.assignSeatColor(decider, choice === Decision.Swap ? otherColor(nextColor) : nextColor);
		this.phase = Phase.Playing;
		void this.advance();
	}

	/** Only available to the human responder at decide1: place 2 more neutral stones. */
	placeTwoMore(): void {
		if (this.phase !== Phase.Decide1 || this.controllers[Seat.White] !== Controller.Human)
			return;
		this.phase = Phase.Balance;
	}

	private assignSeatColor(seat: Seat, color: Color) {
		this.swapped = seat === Seat.Black ? color === Color.White : color === Color.Black;
	}

	private engineFor(seat: Seat): Promise<RapfiEngine> {
		const enginePromise = this.enginePromises.get(seat);
		if (!enginePromise) throw new Error(`No engine registered for seat "${seat}"`);
		return enginePromise;
	}

	private finishTurn() {
		const last = this.board.moves[this.board.moves.length - 1];
		if (last && checkFiveInRow(this.board.board, last)) {
			this.winner = this.board.board[last]!;
			this.phase = Phase.Finished;
			return;
		}
		if (this.board.moves.length >= BOARD_SIZE * BOARD_SIZE) {
			this.phase = Phase.Finished;
			return;
		}
		void this.advance();
	}

	/** Triggers whatever computer action the current phase/turn calls for; no-op for human turns. */
	private async advance(): Promise<void> {
		if (this.phase === Phase.Opening) {
			if (this.controllers[Seat.Black] === Controller.Computer) await this.runOpening();
			return;
		}

		if (this.phase === Phase.Decide1 || this.phase === Phase.Decide2) {
			const decider: Seat = this.phase === Phase.Decide1 ? Seat.White : Seat.Black;
			if (this.controllers[decider] === Controller.Computer) await this.runDecision(decider);
			return;
		}

		if (this.phase === Phase.Playing && this.nextController === Controller.Computer) {
			await this.runMove(this.seatFor(this.nextColor));
		}
	}

	private async runOpening() {
		this.thinking = true;
		try {
			const engine = await this.engineFor(Seat.Black);
			const reply = await engine.proposeOpening();
			for (const coordinate of fromProtocolList(reply)) this.board.play(coordinate);
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
			const tags = decisionTags(decider, this.board.moves.length);
			const position = this.board.moves.map((c, i) => `${toProtocol(c)},${tags[i] ? 1 : 2}`);
			const engine = await this.engineFor(decider);
			const reply = await engine.decideSwap(position);

			const nextColor = this.nextColor;
			if (reply === "SWAP") {
				this.assignSeatColor(decider, otherColor(nextColor));
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
				(c, i) => `${toProtocol(c)},${this.seatFor(colorOf(i)) === seat ? 1 : 2}`,
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
