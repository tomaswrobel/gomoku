import { Board } from "./Board.svelte";
import { Color, oppositeColor } from "./Color.ts";
import { colorAtMove } from "./colorAtMove.ts";
import { Controller } from "./Controller.ts";
import type { Coordinate } from "./coordinate/Coordinate.ts";
import { Decision } from "./Decision.ts";
import { fromProtocol } from "./coordinate/fromProtocol.ts";
import { fromProtocolList } from "./coordinate/fromProtocolList.ts";
import { RapfiEngine } from "../engine/RapfiEngine.ts";
import { toProtocol } from "./coordinate/toProtocol.ts";
import { Phase } from "./Phase.ts";
import type { PersistedGame } from "./PersistedGame.ts";
import { OppositeSeat, Seat } from "./Seat.ts";
import { boardSize } from "./boardSize.ts";
import { checkFiveInRow } from "./checkFiveInRow.ts";
import { difficultyTurnTime } from "./difficultyTurnTime.ts";
import { OpeningRule } from "./OpeningRule.ts";
import { Settings } from "../settings/settings.ts";
import { assert } from "@juvofy/lib/utils/assert";

/// Orchestrates a full game under either the Gomoku Swap2 or standard opening rule: under Swap2,
/// the "black" seat always proposes the opening (3 stones), the "white" seat decides whether to
/// swap, play on, or place 2 more balancing stones (in which case "black" makes the final
/// swap/play decision); under the standard rule, play starts directly from an empty board. Each
/// seat is independently controlled by a human (mouse clicks) or a Rapfi engine instance (Gomocup
/// protocol).
export class Game {
	public readonly board: Board;
	public readonly openingRule: OpeningRule;

	public readonly controllers: Record<Seat, Controller>;
	public swapped = $state(false);
	public phase = $state<Phase>(Phase.Opening);
	public thinking = $state(false);
	public winner = $state<Color | null>(null);

	private readonly enginePromises = new Map<Seat, Promise<RapfiEngine>>();
	private started = false;

	public constructor(
		openingRule: OpeningRule,
		controllers: Record<Seat, Controller>,
		moves: Coordinate[] = [],
	) {
		this.controllers = $state(controllers);
		this.board = new Board(moves);
		this.openingRule = openingRule;
	}

	/// Reconstructs a game from a previously-persisted snapshot; call `resume()` (not `start()`)
	/// afterwards to pick play back up, since the opening has already happened.
	public static restore(data: PersistedGame): Game {
		const game = new Game(data.openingRule, data.controllers, data.moves);
		game.swapped = data.swapped;
		game.phase = data.phase;
		game.winner = data.winner;
		return game;
	}

	public toJSON(): PersistedGame {
		return {
			controllers: this.controllers,
			swapped: this.swapped,
			phase: this.phase,
			winner: this.winner,
			moves: this.board.moves,
			openingRule: this.openingRule,
		};
	}

	public seatFor(color: Color): Seat {
		const base: Seat = color === Color.Black ? Seat.Player1 : Seat.Player2;
		return this.swapped ? OppositeSeat[base] : base;
	}

	public controllerFor(color: Color): Controller {
		return this.controllers[this.seatFor(color)];
	}

	public readonly nextColor: Color = $derived.by(() => colorAtMove(this.board.moves.length));
	public readonly nextController: Controller = $derived.by(() =>
		this.controllerFor(this.nextColor),
	);

	public readonly decisionSeat: Seat | null = $derived.by(() => {
		if (this.phase === Phase.Decide1) {
			return Seat.Player2;
		}
		if (this.phase === Phase.Decide2) {
			return Seat.Player1;
		}
		return null;
	});

	public async start(): Promise<void> {
		if (this.started) {
			return;
		}
		this.started = true;
		this.initEngines();
		this.phase = this.openingRule === OpeningRule.Standard ? Phase.Playing : Phase.Opening;
		await this.advance();
	}

	/// Picks a game back up from a `Game.restore()` snapshot: same engine setup as `start()`,
	/// but keeps whatever phase/moves were restored instead of resetting to a fresh opening.
	public async resume(): Promise<void> {
		if (this.started) {
			return;
		}
		this.started = true;
		this.initEngines();
		await this.advance();
	}

	private initEngines(): void {
		for (const seat of Object.values(Seat)) {
			if (this.controllers[seat] === Controller.Computer) {
				this.enginePromises.set(seat, this.createEngine());
			}
		}
	}

	private async createEngine(): Promise<RapfiEngine> {
		const engine = new RapfiEngine();
		await engine.init(boardSize, difficultyTurnTime[Settings.value.difficulty]);
		return engine;
	}

	public destroy(): void {
		for (const enginePromise of this.enginePromises.values()) {
			void enginePromise.then((engine) => engine.terminate());
		}
		this.enginePromises.clear();
	}

	/** Called from the board UI when a human clicks an empty cell. */
	public humanPlay(coordinate: Coordinate): void {
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
	public decide(choice: Decision): void {
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
	public placeTwoMore(): void {
		if (this.phase !== Phase.Decide1 || this.controllers[Seat.Player2] !== Controller.Human) {
			return;
		}
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
			fromProtocolList(reply).forEach((coordinate) => this.board.play(coordinate));
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
				(c, i) => `${toProtocol(c)},${this.seatFor(colorAtMove(i)) === seat ? 1 : 2}`,
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
