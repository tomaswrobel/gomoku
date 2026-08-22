import { Color } from "./Color.ts";

/// The color placed at a given 0-based move index: black plays on even indices, white on odd ones.
export function colorAtMove(moveIndex: number): Color {
	return moveIndex % 2 ? Color.White : Color.Black;
}
