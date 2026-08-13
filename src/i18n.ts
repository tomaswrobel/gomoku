import type { Locale } from "./Locale";

const dictionary = {
	title: { cs: "Gomoku – Swap2", en: "Gomoku — Swap2" },
	newGame: { cs: "Nová hra", en: "New game" },
	player1: { cs: "Hráč 1", en: "Player 1" },
	player2: { cs: "Hráč 2", en: "Player 2" },
	blackColor: { cs: "černými", en: "black" },
	whiteColor: { cs: "bílými", en: "white" },
	human: { cs: "Člověk", en: "Human" },
	computer: { cs: "Počítač (Rapfi)", en: "Computer (Rapfi)" },
	draw: { cs: "Remíza — deska je plná.", en: "Draw — the board is full." },
	winner: {
		cs: "Vyhrál hráč hrající {color} ({seat})!",
		en: "The player playing {color} ({seat}) won!",
	},
	thinking: { cs: "Počítač přemýšlí…", en: "Computer is thinking…" },
	opening: {
		cs: "{seat} pokládá 3 úvodní kameny (Swap2).",
		en: "{seat} places the 3 opening stones (Swap2).",
	},
	deciding: {
		cs: "{seat} rozhoduje o výměně barev…",
		en: "{seat} is deciding whether to swap colors…",
	},
	balance: {
		cs: "{seat} pokládá 2 vyrovnávací kameny.",
		en: "{seat} places 2 balancing stones.",
	},
	turn: { cs: "Na tahu: {color} ({seat})", en: "To move: {color} ({seat})" },
	keep: { cs: "Hrát {color}", en: "Play {color}" },
	swap: { cs: "Vyměnit a hrát {color}", en: "Swap and play {color}" },
	placeTwoMore: { cs: "Umístit ještě 2 kameny", en: "Place 2 more stones" },
	settings: { cs: "Nastavení", en: "Settings" },
	back: { cs: "Zpět", en: "Back" },
	language: { cs: "Jazyk", en: "Language" },
	appearance: { cs: "Vzhled", en: "Appearance" },
	history: { cs: "Historie tahů", en: "Move history" },
	noMoves: { cs: "Zatím žádné tahy.", en: "No moves yet." },
	blackLabel: { cs: "Černé", en: "Black" },
	whiteLabel: { cs: "Bílé", en: "White" },
	viewPrevious: { cs: "Předchozí tah", en: "Previous move" },
	viewNext: { cs: "Další tah", en: "Next move" },
	viewingMove: { cs: "Prohlížíte tah {step} z {total}", en: "Viewing move {step} of {total}" },
	about: { cs: "O autorovi", en: "About the author" },
	version: { cs: "Verze {version}", en: "Version {version}" },
	gameplay: { cs: "Hra", en: "Gameplay" },
	confirmMoves: { cs: "Potvrzovat tahy", en: "Confirm moves" },
	confirmMove: { cs: "Potvrdit tah", en: "Confirm move" },
	difficulty: { cs: "Obtížnost Rapfiho", en: "Rapfi's difficulty" },
	easy: { cs: "Snadná", en: "Easy" },
	medium: { cs: "Střední", en: "Medium" },
	hard: { cs: "Těžká", en: "Hard" },
	overlineWins: {
		cs: "Přesah (6 a více v řadě) je výhra",
		en: "Overline (6-or-more in a row) counts as a win",
	},
} satisfies Record<string, Record<Locale, string>>;

type MessageKey = keyof typeof dictionary;

export function t(key: MessageKey, locale: Locale, vars: Record<string, string> = {}): string {
	let text: string = dictionary[key][locale];
	for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, value);
	return text;
}
