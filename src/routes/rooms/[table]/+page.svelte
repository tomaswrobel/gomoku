<script lang="ts">
	import { goto } from "$app/navigation";
	import Card from "@juvofy/lib/components/display/Card";
	import Button from "@juvofy/lib/components/actions/Button";
	import { i18nContext } from "$lib/i18n/i18nContext.ts";
	import DiscordSignInButton from "$lib/auth/DiscordSignInButton.svelte";
	import { sitAtTable } from "$lib/online/sitAtTable.ts";
	import { createSupabaseBrowserClient } from "$lib/supabase/client.ts";
	import type { TimeControl } from "$lib/supabase/database.types";
	import type { PageProps } from "./$types";

	const { data }: PageProps = $props();

	const i18n = i18nContext.get();

	let timeControl = $state<TimeControl>("15");
	let joining = $state(false);

	// If there's already a game running at this table, spectate/play it via the shared
	// /game/[id] route (decision #11) rather than duplicating the live board here.
	$effect(() => {
		if (data.activeGameId) {
			void goto(`/game/${data.activeGameId}`);
		}
	});

	async function join() {
		joining = true;
		try {
			const supabase = createSupabaseBrowserClient();
			const game = await sitAtTable(supabase, data.tableId, timeControl);
			if (game) {
				await goto(`/game/${game.id}`);
			}
		} finally {
			joining = false;
		}
	}
</script>

<Card decoration="border">
	<div class="flex flex-col gap-3">
		<h2 class="font-medium">{i18n.t("table")} {data.tableId}</h2>
		<p class="text-sm opacity-60">{data.seats.length}/2 · {i18n.t("spectators")}</p>

		{#if data.session}
			<label class="flex items-center justify-between gap-2 text-sm">
				{i18n.t("timeControl")}
				<select class="select select-sm" bind:value={timeControl}>
					<option value="15">{i18n.t("minutes15")}</option>
					<option value="30">{i18n.t("minutes30")}</option>
					<option value="60">{i18n.t("minutes60")}</option>
				</select>
			</label>
			<Button variant="primary" disabled={joining || data.seats.length >= 2} onclick={join}>
				{i18n.t("sitDown")}
			</Button>
		{:else}
			<p class="text-sm opacity-60">{i18n.t("signInRequired")}</p>
			<DiscordSignInButton />
		{/if}
	</div>
</Card>
