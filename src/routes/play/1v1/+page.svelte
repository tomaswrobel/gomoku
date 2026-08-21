<script lang="ts">
	import { goto } from "$app/navigation";
	import Card from "@juvofy/lib/components/display/Card";
	import Button from "@juvofy/lib/components/actions/Button";
	import { i18nContext } from "$lib/i18n/i18nContext";
	import { createSupabaseBrowserClient } from "$lib/supabase/client";
	import type { TimeControl } from "$lib/supabase/database.types";
	import { OpeningRule } from "$lib/game/OpeningRule";
	import type { PageProps } from "./$types";

	const { data }: PageProps = $props();

	const i18n = i18nContext.get();

	let opponentId = $state("");
	$effect(() => {
		opponentId = data.opponents[0]?.id ?? "";
	});
	let timeControl = $state<TimeControl>("15");
	let creating = $state(false);

	async function createGame() {
		if (!opponentId) {
			return;
		}
		creating = true;
		try {
			const supabase = createSupabaseBrowserClient();
			const { data: game, error } = await supabase.rpc("create_game", {
				p_kind: "1v1",
				p_table_id: null,
				p_opponent_id: opponentId,
				p_opening_rule: OpeningRule.Swap2,
				p_time_control: timeControl,
			});
			if (error) {
				throw error;
			}
			await goto(`/game/${game.id}`);
		} finally {
			creating = false;
		}
	}
</script>

<Card decoration="border">
	<div class="flex flex-col gap-3">
		<h2 class="font-medium">{i18n.t("invitePlayer")}</h2>

		{#if data.opponents.length === 0}
			<p class="text-sm opacity-60">{i18n.t("noOnlineGames")}</p>
		{:else}
			<select class="select" bind:value={opponentId}>
				{#each data.opponents as opponent (opponent.id)}
					<option value={opponent.id}>{opponent.display_name}</option>
				{/each}
			</select>

			<select class="select" bind:value={timeControl}>
				<option value="15">{i18n.t("minutes15")}</option>
				<option value="30">{i18n.t("minutes30")}</option>
				<option value="60">{i18n.t("minutes60")}</option>
			</select>

			<Button variant="primary" disabled={creating} onclick={createGame}>
				{i18n.t("createGame")}
			</Button>
		{/if}
	</div>
</Card>
