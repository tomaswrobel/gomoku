import { boardSize } from "./boardSize";
import type { Color } from "./Color";
import type { Coordinate } from "./coordinate/Coordinate";
import { Horizontal } from "./coordinate/Horizontal";

const DIRECTIONS: [number, number][] = [
	[1, 0],
	[0, 1],
	[1, 1],
	[1, -1],
];

export function checkFiveInRow(
	board: Partial<Record<Coordinate, Color>>,
	last: Coordinate,
	overlineWins: boolean,
): boolean {
	const color = board[last];
	if (!color) {
		return false;
	}

	const x0 = Horizontal.indexOf(last[0] as Horizontal);
	const y0 = Number(last.slice(1)) - 1;

	for (const [dx, dy] of DIRECTIONS) {
		let count = 1;
		for (const sign of [-1, 1]) {
			let x = x0 + dx * sign;
			let y = y0 + dy * sign;
			while (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
				const coordinate = `${Horizontal[x]}${y + 1}` as Coordinate;
				if (board[coordinate] !== color) break;
				count++;
				x += dx * sign;
				y += dy * sign;
			}
		}
		if (overlineWins ? count >= 5 : count === 5) {
			return true;
		}
	}
	return false;
}
