<script lang="ts">
	import Card from "@juvofy/lib/components/display/Card";
	import Button from "@juvofy/lib/components/actions/Button";
	import { i18nContext } from "$lib/i18n/i18nContext";
	import DiscordSignInButton from "$lib/auth/DiscordSignInButton.svelte";
	import type { PageProps } from "./$types";

	const { data }: PageProps = $props();

	const i18n = i18nContext.get();
</script>

<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
	<Card decoration="border">
		<div class="flex flex-col gap-3">
			<h2 class="font-medium">{i18n.t("playLocal")}</h2>
			<p class="text-sm opacity-60">{i18n.t("playLocalDescription")}</p>
			<a href="/play/local">
				<Button variant="primary" class="w-full">{i18n.t("playLocal")}</Button>
			</a>
		</div>
	</Card>

	<Card decoration="border">
		<div class="flex flex-col gap-3">
			<h2 class="font-medium">{i18n.t("playOnline")}</h2>
			<p class="text-sm opacity-60">{i18n.t("playOnlineDescription")}</p>
			{#if data.session}
				<a href="/play/1v1">
					<Button variant="primary" class="w-full">{i18n.t("play1v1")}</Button>
				</a>
				<a href="/rooms">
					<Button class="w-full">{i18n.t("rooms")}</Button>
				</a>
			{:else}
				<a href="/rooms">
					<Button class="w-full">{i18n.t("spectateRooms")}</Button>
				</a>
				<DiscordSignInButton />
			{/if}
		</div>
	</Card>
</div>
