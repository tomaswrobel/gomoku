import { detectLocale } from "../i18n/detectLocale.ts";
import { BoardStyle } from "./BoardStyle.ts";
import { Difficulty } from "./Difficulty.ts";
import type { Locale } from "../i18n/Locale.ts";
import { OpeningRule } from "../game/OpeningRule.ts";
import { StorageState } from "./StorageState.svelte";
import { Theme } from "./Theme.ts";
import { version } from "../../../package.json";

const [major, minor, _patch] = version.split(".");

interface SettingsValue {
	locale: Locale;
	theme: Theme;
	confirmMoves: boolean;
	difficulty: Difficulty;
	overlineWins: boolean;
	boardStyle: BoardStyle;
	openingRule: OpeningRule;
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
		openingRule: OpeningRule.Swap2,
	},
);
