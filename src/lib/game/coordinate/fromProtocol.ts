import { Horizontal } from "./Horizontal.ts";
import type { Coordinate } from "./Coordinate.ts";

/** Converts a single Rapfi protocol "x,y" pair back into our Coordinate. */
export function fromProtocol(token: string): Coordinate {
	const [x, y] = token.split(",").map(Number);
	return `${Horizontal[x]}${y + 1}` as Coordinate;
}
