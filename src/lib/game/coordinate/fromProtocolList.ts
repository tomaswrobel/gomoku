import { fromProtocol } from "./fromProtocol.ts";
import type { Coordinate } from "./Coordinate.ts";

/** Splits a whitespace-separated list of "x,y" pairs (as returned for opening moves). */
export function fromProtocolList(tokens: string): Coordinate[] {
	return tokens.trim().split(/\s+/).filter(Boolean).map(fromProtocol);
}
