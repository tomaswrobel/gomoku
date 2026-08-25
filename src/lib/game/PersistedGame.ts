import type { Color } from "./Color.ts";
import type { Controller } from "./Controller.ts";
import type { Coordinate } from "./coordinate/Coordinate.ts";
import type { OpeningRule } from "./OpeningRule.ts";
import type { Phase } from "./Phase.ts";
import type { Seat } from "./Seat.ts";

/// Plain-data snapshot of a Game, serializable as-is (e.g. into StorageState).
export interface PersistedGame {
	controllers: Record<Seat, Controller>;
	swapped: boolean;
	phase: Phase;
	winner: Color | null;
	moves: Coordinate[];
	openingRule: OpeningRule;
}
