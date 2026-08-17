export enum Color {
	Black = "Black",
	White = "White",
}

export function oppositeColor(color: Color): Color {
	return color === Color.Black ? Color.White : Color.Black;
}
