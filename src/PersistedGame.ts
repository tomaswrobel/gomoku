import type { Color } from "./Color";
import type { Controller } from "./Controller";
import type { Coordinate } from "./coordinate/Coordinate";
import type { Phase } from "./Phase";
import type { Seat } from "./Seat";

/// Plain-data snapshot of a SwapTwoGame, serializable as-is (e.g. into StorageState).
export interface PersistedGame {
	controllers: Record<Seat, Controller>;
	swapped: boolean;
	phase: Phase;
	winner: Color | null;
	moves: Coordinate[];
}
