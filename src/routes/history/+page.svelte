<script lang="ts">
	import { goto } from "$app/navigation";
	import Card from "@juvofy/lib/components/display/Card";
	import Button from "@juvofy/lib/components/actions/Button";
	import BackIcon from "@material-symbols/svg-400/rounded/arrow_back.svg?icon";
	import HistoryPanel from "$lib/components/HistoryPanel.svelte";
	import { i18nContext } from "$lib/i18n/i18nContext.ts";
	import { StorageState } from "$lib/settings/StorageState.svelte";
	import { Game } from "$lib/game/Game.svelte";
	import type { PersistedGame } from "$lib/game/PersistedGame.ts";
	import type { PageProps } from "./$types";

	const { data }: PageProps = $props();

	const i18n = i18nContext.get();

	const persistedGame = new StorageState<PersistedGame | null>("local", "gomoku:game", null);
	const localGame = $derived(persistedGame.value ? Game.restore(persistedGame.value) : null);
</script>

<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
	{#if data.onlineGames}
		<Card decoration="border">
			<h2 class="mb-2 font-medium">{i18n.t("onlineHistory")}</h2>
			{#if data.onlineGames.length === 0}
				<p class="text-sm opacity-60">{i18n.t("noOnlineGames")}</p>
			{:else}
				<ul class="flex flex-col gap-1 text-sm">
					{#each data.onlineGames as onlineGame (onlineGame.id)}
						<li>
							<a
								href="/game/{onlineGame.id}"
								class="link link-hover flex justify-between gap-2"
							>
								<span>{onlineGame.player1_name} vs {onlineGame.player2_name}</span>
								<span class="opacity-60">{onlineGame.status}</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	{/if}

	<HistoryPanel game={localGame} onBack={() => goto("/")} />
</div>
