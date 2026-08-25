import dictionary from "./dictionary.json";
import type { Locale } from "./Locale.ts";

type MessageKey = keyof typeof dictionary;

export function translate(
	key: MessageKey,
	locale: Locale,
	vars: Record<string, string> = {},
): string {
	let text: string = dictionary[key][locale];
	for (const [name, value] of Object.entries(vars)) {
		text = text.replaceAll(`{${name}}`, value);
	}
	return text;
}
