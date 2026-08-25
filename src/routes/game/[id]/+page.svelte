<script lang="ts">
	import Card from "@juvofy/lib/components/display/Card";
	import GomokuBoard from "$lib/components/GomokuBoard.svelte";
	import { Board } from "$lib/game/Board.svelte";
	import { i18nContext } from "$lib/i18n/i18nContext.ts";
	import { RemoteGame } from "$lib/online/RemoteGame.svelte";
	import { RemoteClock } from "$lib/online/RemoteClock.svelte";
	import type { PageProps } from "./$types";

	const { data }: PageProps = $props();

	const i18n = i18nContext.get();

	const isLive = $derived(data.game.status === "waiting" || data.game.status === "active");

	// Finished/aborted games: read-only replay from the snapshot, no realtime subscription needed.
	const replayBoard = $derived(isLive ? null : new Board(data.persistedGame.moves));

	// Live games: mount the realtime-subscribed RemoteGame; interactive for seated players,
	// read-only for everyone else (including anonymous spectators).
	let remote = $state<RemoteGame | null>(null);
	let clock1 = $state<RemoteClock | null>(null);
	let clock2 = $state<RemoteClock | null>(null);

	$effect(() => {
		if (!isLive) {
			return;
		}
		const game = new RemoteGame(
			data.supabase!,
			data.game,
			data.persistedGame.moves,
			data.viewerId,
		);
		game.subscribe();
		remote = game;
		clock1 = new RemoteClock(data.game.player1_clock_ms, data.game.clock_running_since);
		clock2 = new RemoteClock(data.game.player2_clock_ms, data.game.clock_running_since);

		return () => {
			game.destroy();
			clock1?.destroy();
			clock2?.destroy();
		};
	});

	$effect(() => {
		if (remote) {
			clock1?.update(remote.player1ClockMs, remote.clockRunningSince);
			clock2?.update(remote.player2ClockMs, remote.clockRunningSince);
		}
	});
</script>

<div class="flex min-h-0 flex-1 flex-col gap-3">
	<Card decoration="border">
		<div class="flex items-center justify-between text-sm">
			<span>{data.game.player1_name}</span>
			{#if isLive && clock1}
				<span class="font-mono">{Math.ceil(clock1.remainingMs / 1000)}s</span>
			{/if}
		</div>
		<div class="flex items-center justify-between text-sm">
			<span>{data.game.player2_name}</span>
			{#if isLive && clock2}
				<span class="font-mono">{Math.ceil(clock2.remainingMs / 1000)}s</span>
			{/if}
		</div>
	</Card>

	<div class="min-h-0 flex-1">
		{#if replayBoard}
			<GomokuBoard board={replayBoard} onPlay={() => {}} disabled />
		{:else if remote}
			<GomokuBoard
				board={remote.board}
				onPlay={(coordinate) => void remote?.play(coordinate)}
				disabled={!remote.canMove}
			/>
		{/if}
	</div>

	{#if !isLive}
		<p class="text-center text-sm opacity-60">{i18n.t("gameFinished")}</p>
	{:else if data.game.status === "waiting"}
		<p class="text-center text-sm opacity-60">{i18n.t("waitingForOpponent")}</p>
	{/if}
</div>
