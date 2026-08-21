import { Locale } from "./Locale";

/// Picks a supported locale from the browser's language preference list, falling back to English.
/// Slovak has no dictionary of its own and is close enough to Czech to reuse it.
export function detectLocale(): Locale {
	if (typeof navigator === "undefined") {
		return Locale.English;
	}

	const languages =
		navigator.languages && navigator.languages.length
			? navigator.languages
			: [navigator.language];

	for (const language of languages) {
		const base = language?.toLowerCase().split("-")[0];
		if (base === "cs" || base === "sk") {
			return Locale.Czech;
		}
		if (base === "en") {
			return Locale.English;
		}
	}

	return Locale.English;
}

/// Server-side counterpart of `detectLocale()`: parses the `Accept-Language` request header
/// instead of `navigator.languages`, so SSR HTML locale matches the client's first paint.
export function detectLocaleFromHeader(acceptLanguage: string | null): Locale {
	if (!acceptLanguage) {
		return Locale.English;
	}

	const languages = acceptLanguage
		.split(",")
		.map((entry) => entry.split(";")[0]?.trim())
		.filter((entry): entry is string => Boolean(entry));

	for (const language of languages) {
		const base = language.toLowerCase().split("-")[0];
		if (base === "cs" || base === "sk") {
			return Locale.Czech;
		}
		if (base === "en") {
			return Locale.English;
		}
	}

	return Locale.English;
}
