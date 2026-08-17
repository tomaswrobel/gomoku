import { boardSize } from "../game/boardSize";
import type { Coordinate } from "../game/coordinate/Coordinate";
import { Horizontal } from "../game/coordinate/Horizontal";

/// Layout constants shared by both board renderers, in SVG user units (1 unit = 1 cell), so the
/// whole board scales via viewBox.
export const MARGIN_X = 1.4;
export const MARGIN_TOP = 0.7;
export const MARGIN_BOTTOM = 1.2;

/// Below this, cells get too small to comfortably tap/read (especially on mobile), so the board
/// stops shrinking and its scroll container (see App.svelte) takes over instead of the cells.
export const MIN_CELL_SIZE_PX = 32;

export function coordinateAt(col: number, row: number): Coordinate {
	return `${Horizontal[col]}${boardSize - row}` as Coordinate;
}

export function buildMoveIndex(moves: readonly Coordinate[]): Partial<Record<Coordinate, number>> {
	const map: Partial<Record<Coordinate, number>> = {};
	moves.forEach((coordinate, i) => (map[coordinate] = i));
	return map;
}

interface BoardInteractionParams {
	board(): { board: Partial<Record<Coordinate, unknown>> };
	disabled(): boolean;
	onPlay(coordinate: Coordinate): void;
}

/// Shared hover-preview + click-to-play behavior for both board renderers: tracks which empty cell
/// the pointer is currently over (cleared on leave/disable/play) and guards clicks against disabled
/// boards or already-occupied cells. Takes its inputs as getters so it keeps reading the latest
/// reactive prop values instead of a snapshot from construction time.
export class BoardInteraction {
	public hoverCoordinate = $state<Coordinate>();

	public constructor(private readonly params: BoardInteractionParams) {}

	public clearHover = (): void => {
		this.hoverCoordinate = undefined;
	};

	public onCellEnter = (coordinate: Coordinate): void => {
		if (!this.params.disabled() && this.params.board().board[coordinate] === undefined) {
			this.hoverCoordinate = coordinate;
		}
	};

	public onCellClick = (coordinate: Coordinate): void => {
		if (this.params.disabled() || this.params.board().board[coordinate]) {
			return;
		}
		this.hoverCoordinate = undefined;
		this.params.onPlay(coordinate);
	};
}
