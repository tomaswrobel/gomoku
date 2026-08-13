import { detectLocale } from "./detectLocale";
import { BoardStyle } from "./BoardStyle";
import { Difficulty } from "./Difficulty";
import type { Locale } from "./Locale";
import { StorageState } from "./StorageState.svelte";
import { Theme } from "./Theme";
import { version } from "../package.json";

const [major, minor, _patch] = version.split(".");

interface SettingsValue {
	locale: Locale;
	theme: Theme;
	confirmMoves: boolean;
	difficulty: Difficulty;
	overlineWins: boolean;
	boardStyle: BoardStyle;
}

export const Settings = new StorageState<SettingsValue>(
	"local",
	`gomoku:settings:${major}.${minor}`,
	{
		locale: detectLocale(),
		theme: Theme.Forest,
		confirmMoves: true,
		difficulty: Difficulty.Medium,
		overlineWins: false,
		boardStyle: BoardStyle.Gomoku,
	},
);
