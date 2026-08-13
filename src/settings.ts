import { detectLocale } from "./detectLocale";
import { Difficulty } from "./Difficulty";
import type { Locale } from "./Locale";
import { StorageState } from "./StorageState.svelte";
import { Theme } from "./Theme";

interface SettingsValue {
	locale: Locale;
	theme: Theme;
	confirmMoves: boolean;
	difficulty: Difficulty;
	overlineWins: boolean;
}

export const Settings = new StorageState<SettingsValue>("local", "gomoku:settings", {
	locale: detectLocale(),
	theme: Theme.Forest,
	confirmMoves: true,
	difficulty: Difficulty.Medium,
	overlineWins: false,
});
