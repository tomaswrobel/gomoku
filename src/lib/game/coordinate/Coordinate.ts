import { isHorizontal, type Horizontal } from "./Horizontal.ts";
import { isVertical, type Vertical } from "./Vertical.ts";

export type Coordinate = `${Horizontal}${Vertical}`;

export function isCoordinate(string: unknown): string is Coordinate {
	return (
		typeof string === "string" &&
		string.length === 2 &&
		isHorizontal(string[0]) &&
		isVertical(Number.parseInt(string[1]))
	);
}
