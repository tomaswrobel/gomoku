<script lang="ts">
	import "../app.css";
	import App from "@juvofy/lib/App";
	import Button from "@juvofy/lib/components/actions/Button";
	import SettingsIcon from "@material-symbols/svg-400/rounded/settings.svg?icon";
	import HistoryIcon from "@material-symbols/svg-400/rounded/history.svg?icon";
	import Logo from "$lib/components/Logo.svelte";
	import { i18nContext } from "$lib/i18n/i18nContext.ts";
	import { translate as t } from "$lib/i18n/translate.ts";
	import { Settings } from "$lib/settings/settings.ts";
	import DiscordSignInButton from "$lib/auth/DiscordSignInButton.svelte";
	import type { LayoutProps } from "./$types";

	const { children, data }: LayoutProps = $props();

	const locale = $derived(Settings.loaded ? Settings.value.locale : data.locale);
	i18nContext.set({
		get locale() {
			return locale;
		},
		t: (key, vars) => t(key, locale, vars),
	});

	$effect(() => {
		document.documentElement.dataset.theme = Settings.value.theme;
	});
</script>

<App lang={locale}>
	<div class="navbar bg-base-100 shadow-sm fixed top-0 z-10">
		<div class="flex flex-1 items-center gap-2 pl-1">
			<a href="/" class="flex items-center gap-2">
				<Logo class="size-8 sm:h-10 sm:w-10" />
				<h1 class="text-xl font-bold sm:text-2xl">{t("title", locale)}</h1>
			</a>
		</div>
		<div class="flex flex-none items-center gap-2 pr-1">
			<a href="/history" aria-label={t("history", locale)}>
				<Button size="sm">
					<HistoryIcon class="size-5 fill-current" />
				</Button>
			</a>
			<a href="/settings" aria-label={t("settings", locale)}>
				<Button size="sm">
					<SettingsIcon class="size-5 fill-current" />
				</Button>
			</a>
			{#if !data.session}
				<DiscordSignInButton />
			{/if}
		</div>
	</div>
	<div
		class="mx-auto flex h-dvh w-full max-w-xl flex-col gap-3 overflow-hidden p-2 sm:max-w-2xl sm:gap-4 sm:p-4 lg:max-w-3xl"
	>
		<div class="navbar pointer-events-none" aria-hidden="true"></div>
		{@render children()}
	</div>
</App>
