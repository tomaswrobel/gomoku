import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { createSupabaseServerClient } from "$lib/supabase/server";
import { detectLocaleFromHeader } from "$lib/i18n/detectLocale";

const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient(event);

	event.locals.getSession = async () => {
		const {
			data: { session },
		} = await event.locals.supabase.auth.getSession();
		return session;
	};

	event.locals.session = await event.locals.getSession();

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === "content-range" || name === "x-supabase-api-version",
	});
};

const locale: Handle = async ({ event, resolve }) => {
	const detectedLocale = detectLocaleFromHeader(event.request.headers.get("accept-language"));
	event.locals.locale = detectedLocale;

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace("%lang%", detectedLocale),
	});
};

export const handle = sequence(supabase, locale);
