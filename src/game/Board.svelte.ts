import { Color } from "./Color";
import type { Coordinate } from "./coordinate/Coordinate";

export class Board {
	public readonly moves: Coordinate[];

	public constructor(moves: Coordinate[] = []) {
		this.moves = $state(moves);
	}

	private readonly history = $state<Coordinate[]>([]);

	public readonly board = $derived.by(() => {
		const board: Partial<Record<Coordinate, Color>> = {};
		for (let i = 0; i < this.moves.length; i++) {
			board[this.moves[i]] = i % 2 ? Color.White : Color.Black;
		}
		return board;
	});

	public play(coordinate: Coordinate) {
		this.moves.push(coordinate);
	}

	public undo() {
		const cooardinate = this.moves.pop();
		if (cooardinate) {
			this.history.push(cooardinate);
		}
	}

	public redo() {
		const cooardinate = this.history.pop();
		if (cooardinate) {
			this.moves.push(cooardinate);
		}
	}

	public goToStep(step: number) {
		const moves = this.moves.splice(step);
		this.history.push(...moves);
	}

	public readonly currentStep = $derived.by(() => this.moves.length);
	public readonly totalSteps = $derived.by(() => this.history.length + this.moves.length);
}
