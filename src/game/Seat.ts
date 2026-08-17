export enum Seat {
	Player1 = "player1",
	Player2 = "player2",
}

export const OppositeSeat: Record<Seat, Seat> = {
	[Seat.Player1]: Seat.Player2,
	[Seat.Player2]: Seat.Player1,
};
