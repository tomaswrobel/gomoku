<script lang="ts">
	import Badge from "@juvofy/lib/components/display/Badge";
	import Button from "@juvofy/lib/components/actions/Button";
	import Card from "@juvofy/lib/components/display/Card";
	import ChangeCircleIcon from "@material-symbols/svg-400/rounded/change_circle.svg?icon";
	import GomokuBoard from "$lib/components/GomokuBoard.svelte";
	import PieceSymbol from "$lib/components/PieceSymbol.svelte";
	import { Board } from "$lib/game/Board.svelte";
	import { Color, oppositeColor } from "$lib/game/Color.ts";
	import { OppositeSeat, Seat } from "$lib/game/Seat.ts";
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

	// Seat currently on the move, for the badge highlight — mirrors Board.svelte's isSeatActive.
	const activeSeat = $derived.by(() => {
		if (!isLive || !remote || remote.status !== "active") {
			return null;
		}
		return remote.seatFor(remote.nextColor);
	});

	// Winner's seat/name, derived from the persisted color + swap flag (same mapping as
	// RemoteGame.seatFor, but off the static snapshot since finished games have no `remote`).
	const winnerSeat = $derived.by(() => {
		if (!data.game.winner_color) {
			return null;
		}
		const base = data.game.winner_color === "Black" ? Seat.Player1 : Seat.Player2;
		return data.game.swapped ? OppositeSeat[base] : base;
	});
	const winnerName = $derived(
		winnerSeat === Seat.Player1 ? data.game.player1_name : data.game.player2_name,
	);
	const winnerPieceColor = $derived(
		data.game.winner_color === "Black" ? Color.Black : Color.White,
	);

	// Name of whoever owes the current decide1/decide2 swap decision, for the "X is deciding…"
	// status text and the buttons row below (shown only to that seat, mirrors Board.svelte).
	const decisionSeatName = $derived(
		remote?.decisionSeat === Seat.Player1 ? data.game.player1_name : data.game.player2_name,
	);
	const isDecider = $derived(
		!!remote && remote.decisionSeat !== null && remote.viewerSeat === remote.decisionSeat,
	);
</script>

<div class="flex min-h-0 flex-1 flex-col gap-3">
	<div class="flex shrink-0 items-center justify-between gap-2 sm:justify-center">
		<Badge variant={activeSeat === Seat.Player1 ? "primary" : undefined} decoration="outline">
			{data.game.player1_name}
			{#if isLive && clock1}
				<span class="font-mono">· {Math.ceil(clock1.remainingMs / 1000)}s</span>
			{/if}
		</Badge>
		<Badge variant={activeSeat === Seat.Player2 ? "primary" : undefined} decoration="outline">
			{data.game.player2_name}
			{#if isLive && clock2}
				<span class="font-mono">· {Math.ceil(clock2.remainingMs / 1000)}s</span>
			{/if}
		</Badge>
	</div>

	{#if isDecider && remote}
		<div class="grid shrink-0 grid-cols-3 gap-2">
			<Button
				size="sm"
				variant="neutral"
				class="btn-outline"
				aria-label={i18n.t("keep", {
					color: i18n.t(remote.nextColor === Color.Black ? "blackColor" : "whiteColor"),
				})}
				onclick={() => remote?.decide("keep")}
			>
				<PieceSymbol color={remote.nextColor} class="size-6" />
			</Button>
			<Button
				size="sm"
				variant="neutral"
				class="btn-outline"
				aria-label={i18n.t("swap", {
					color: i18n.t(
						oppositeColor(remote.nextColor) === Color.Black
							? "blackColor"
							: "whiteColor",
					),
				})}
				onclick={() => remote?.decide("swap")}
			>
				<PieceSymbol color={oppositeColor(remote.nextColor)} class="size-6" />
			</Button>
			<Button
				size="sm"
				variant="neutral"
				disabled={remote.phase !== "decide1"}
				aria-label={i18n.t("placeTwoMore", { piece: i18n.t("pieceStones") })}
				onclick={() => remote?.placeTwoMore()}
			>
				<ChangeCircleIcon class="size-6 fill-current" />
			</Button>
		</div>
	{:else}
		<Card decoration="border" size="sm" class="shrink-0">
			<div class="flex items-center justify-center gap-2 text-center text-sm">
				{#if !isLive}
					{#if winnerSeat}
						<span class="flex items-center gap-1 font-medium">
							{i18n.t("winnerPrefix")}
							<PieceSymbol color={winnerPieceColor} class="size-5" />
							{i18n.t("onlineWinnerSuffix", { name: winnerName })}
						</span>
					{:else}
						{i18n.t("draw")}
					{/if}
				{:else if data.game.status === "waiting"}
					{i18n.t("waitingForOpponent")}
				{:else if remote?.phase === "opening"}
					{i18n.t("opening", {
						seat: data.game.player1_name,
						piece: i18n.t("pieceStones"),
					})}
				{:else if remote?.phase === "balance"}
					{i18n.t("balance", {
						seat: data.game.player2_name,
						piece: i18n.t("pieceStones"),
					})}
				{:else if remote?.decisionSeat}
					{i18n.t("deciding", { seat: decisionSeatName })}
				{:else if remote}
					<span class="flex items-center gap-1">
						{i18n.t("turnPrefix")}
						<PieceSymbol color={remote.nextColor} class="size-5" />
						({remote.seatFor(remote.nextColor) === Seat.Player1
							? data.game.player1_name
							: data.game.player2_name})
					</span>
				{/if}
			</div>
		</Card>
	{/if}

	<div class="flex min-h-0 flex-1 items-center-safe justify-center-safe overflow-auto">
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
</div>
