import { Horizontal } from "./Horizontal.ts";
import type { Coordinate } from "./Coordinate.ts";

/** Converts our "A1".."O15" coordinate into Rapfi's protocol "x,y" pair (0-based, no coord conversion). */
export function toProtocol(coordinate: Coordinate): string {
	const x = Horizontal.indexOf(coordinate[0] as (typeof Horizontal)[number]);
	const y = Number(coordinate.slice(1)) - 1;
	return `${x},${y}`;
}
