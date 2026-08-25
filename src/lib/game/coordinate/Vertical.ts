import { array } from "../array.ts";

export const Vertical = array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
export type Vertical = (typeof Vertical)[number];

export function isVertical(number: unknown): number is Vertical {
	return typeof number === "number" && Vertical.includes(number as Vertical);
}
