import { array } from "../array";

export const Horizontal = array(
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
	"G",
	"H",
	"I",
	"J",
	"K",
	"L",
	"M",
	"N",
	"O",
);
export type Horizontal = (typeof Horizontal)[number];

export function isHorizontal(string: unknown): string is Horizontal {
	return typeof string === "string" && Horizontal.includes(string as Horizontal);
}
