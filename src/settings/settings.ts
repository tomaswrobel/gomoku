import { detectLocale } from "../i18n/detectLocale";
import { BoardStyle } from "./BoardStyle";
import { Difficulty } from "./Difficulty";
import type { Locale } from "../i18n/Locale";
import { OpeningRule } from "../game/OpeningRule";
import { StorageState } from "./StorageState.svelte";
import { Theme } from "./Theme";
import { version } from "../../package.json";

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
