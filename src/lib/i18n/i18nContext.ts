import { createContext } from "svelte";
import { translate } from "./translate.ts";
import type { Locale } from "./Locale.ts";

interface I18n {
	readonly locale: Locale;
	t(key: Parameters<typeof translate>[0], vars?: Parameters<typeof translate>[2]): string;
}

const [get, set] = createContext<I18n>();

export const i18nContext = { get, set };
