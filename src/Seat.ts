export enum Seat {
	Player1 = "player1",
	Player2 = "player2",
}

export function oppositeSeat(seat: Seat): Seat {
	return seat === Seat.Player1 ? Seat.Player2 : Seat.Player1;
}
