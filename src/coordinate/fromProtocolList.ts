import { fromProtocol } from "./fromProtocol";
import type { Coordinate } from "./Coordinate";

/** Splits a whitespace-separated list of "x,y" pairs (as returned for opening moves). */
export function fromProtocolList(tokens: string): Coordinate[] {
	return tokens.trim().split(/\s+/).filter(Boolean).map(fromProtocol);
}
