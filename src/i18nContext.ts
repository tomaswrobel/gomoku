import { createContext } from "svelte";
import { t } from "./i18n";
import type { Locale } from "./Locale";

interface I18n {
	readonly locale: Locale;
	t(key: Parameters<typeof t>[0], vars?: Parameters<typeof t>[2]): string;
}

const [getContextValue, setContextValue] = createContext<I18n>();

/// Provides the current locale + a bound `t()` down the component tree, so descendants never need
/// `locale` passed as a prop: `App.svelte` calls `.set(...)` once, everyone else calls `.get()`.
export const i18nContext = { get: getContextValue, set: setContextValue };
