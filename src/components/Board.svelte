<script lang="ts">
	import Badge from "@juvofy/lib/components/display/Badge";
	import Button from "@juvofy/lib/components/actions/Button";
	import Card from "@juvofy/lib/components/display/Card";
	import Status from "@juvofy/lib/components/display/Status";
	import ChevronLeftIcon from "@material-symbols/svg-400/rounded/chevron_left.svg?icon";
	import ChevronRightIcon from "@material-symbols/svg-400/rounded/chevron_right.svg?icon";
	import CheckIcon from "@material-symbols/svg-400/rounded/check.svg?icon";
	import ChangeCircleIcon from "@material-symbols/svg-400/rounded/change_circle.svg?icon";
	import GomokuBoard from "./GomokuBoard.svelte";
	import PieceSymbol from "./PieceSymbol.svelte";
	import PiskvorkyBoard from "./PiskvorkyBoard.svelte";
	import { BoardStyle } from "../settings/BoardStyle";
	import { Board as GameBoard } from "../game/Board.svelte";
	import { Color, oppositeColor } from "../game/Color";
	import type { Coordinate } from "../game/coordinate/Coordinate";
	import { Controller } from "../game/Controller";
	import { Decision } from "../game/Decision";
	import type { Game } from "../game/Game.svelte";
	import { i18nContext } from "../i18n/i18nContext";
	import { Phase } from "../game/Phase";
	import { Seat } from "../game/Seat";
	import { Settings } from "../settings/settings";

	const { game, onBackToSetup }: { game: Game; onBackToSetup(): void } = $props();

	const i18n = i18nContext.get();

	// null = looking at the live position; otherwise the number of moves currently shown, so the
	// left/right arrows next to the status bar can step through history without touching the game.
	let viewIndex = $state<number | null>(null);

	const viewBoard = $derived.by(() => {
		if (viewIndex === null) {
			return game.board;
		}
		return new GameBoard(game.board.moves.slice(0, viewIndex));
	});
	const canViewBack = $derived((viewIndex ?? game.board.moves.length) > 0);
	const canViewForward = $derived(viewIndex !== null);

	function viewBack() {
		if (!canViewBack) {
			return;
		}
		viewIndex = (viewIndex ?? game.board.moves.length) - 1;
	}

	function viewForward() {
		if (viewIndex === null) {
			return;
		}
		const next = viewIndex + 1;
		viewIndex = next >= game.board.moves.length ? null : next;
	}

	// A human move waiting for the checkmark button, when "confirm moves" is on. Never used at all
	// when it's off, in which case play() below applies moves immediately, exactly like before.
	let pendingMove = $state<Coordinate>();
	const canConfirmMove = $derived(pendingMove !== undefined && viewIndex === null);

	// Clears any pending selection whenever it would no longer make sense to keep showing it: a move
	// actually being applied (by anyone), or switching in/out of the history viewer.
	$effect(() => {
		void game.board.moves.length;
		void viewIndex;
		pendingMove = undefined;
	});

	function play(coordinate: Coordinate) {
		if (!Settings.value.confirmMoves) {
			game.humanPlay(coordinate);
			return;
		}
		pendingMove = pendingMove === coordinate ? undefined : coordinate;
	}

	function confirmMove() {
		if (pendingMove === undefined) {
			return;
		}
		game.humanPlay(pendingMove);
		pendingMove = undefined;
	}

	function colorLabel(color: Color) {
		return i18n.t(color === Color.Black ? "blackColor" : "whiteColor");
	}

	// Swap2 status text mentions the pieces being placed; word it to match what the active board
	// style actually renders (Piškvorky's X/O marks read as "symbols", Gomoku's discs as "stones").
	const pieceWord = $derived(
		i18n.t(Settings.value.boardStyle === BoardStyle.Piskvorky ? "pieceSymbols" : "pieceStones"),
	);

	// Board interaction (hover previews, clicks) doesn't apply while stepping through history, while
	// the engine is thinking, or during a Swap2 decision — that phase is driven by the buttons above,
	// not board clicks, so a hover preview there would be misleading.
	const boardDisabled = $derived(
		viewIndex !== null || game.thinking || game.decisionSeat !== null,
	);

	const isHumanDeciding = $derived(
		viewIndex === null &&
			game.decisionSeat !== null &&
			game.controllers[game.decisionSeat] === Controller.Human,
	);

	function isSeatActive(seat: Seat): boolean {
		if (game.phase === Phase.Finished) {
			return false;
		}
		if (game.phase === Phase.Opening) {
			return seat === Seat.Player1;
		}
		if (game.decisionSeat) {
			return seat === game.decisionSeat;
		}
		if (game.phase === Phase.Balance) {
			return seat === Seat.Player2;
		}
		return seat === game.seatFor(game.nextColor);
	}
</script>

<div class="flex justify-between sm:justify-center shrink-0 items-center gap-2">
	<Badge variant={isSeatActive(Seat.Player1) ? "primary" : undefined} decoration="outline">
		{i18n.t(Seat.Player1)}
		<span class="hidden sm:inline">· {i18n.t(game.controllers[Seat.Player1])}</span>
	</Badge>
	<Button size="sm" onclick={onBackToSetup}>{i18n.t("newGame")}</Button>
	<Badge variant={isSeatActive(Seat.Player2) ? "primary" : undefined} decoration="outline">
		{i18n.t(Seat.Player2)}
		<span class="hidden sm:inline">· {i18n.t(game.controllers[Seat.Player2])}</span>
	</Badge>
</div>

<div class="flex shrink-0 items-center gap-2">
	<Button
		size="sm"
		disabled={!canViewBack}
		aria-label={i18n.t("viewPrevious")}
		onclick={viewBack}
	>
		<ChevronLeftIcon class="size-5 fill-current" />
	</Button>

	{#if isHumanDeciding}
		<div class="grid min-w-0 flex-1 grid-cols-3 gap-2">
			<Button
				size="sm"
				variant="neutral"
				class="btn-outline"
				aria-label={i18n.t("keep", { color: colorLabel(game.nextColor) })}
				onclick={() => game.decide(Decision.Keep)}
			>
				<PieceSymbol color={game.nextColor} class="size-6" />
			</Button>
			<Button
				size="sm"
				variant="neutral"
				class="btn-outline"
				aria-label={i18n.t("swap", { color: colorLabel(oppositeColor(game.nextColor)) })}
				onclick={() => game.decide(Decision.Swap)}
			>
				<PieceSymbol color={oppositeColor(game.nextColor)} class="size-6" />
			</Button>
			<Button
				size="sm"
				variant="neutral"
				disabled={game.phase !== Phase.Decide1}
				aria-label={i18n.t("placeTwoMore", { piece: pieceWord })}
				onclick={() => game.placeTwoMore()}
			>
				<ChangeCircleIcon class="size-6 fill-current" />
			</Button>
		</div>
	{:else}
		<Card decoration="border" size="sm" class="min-w-0 flex-1">
			<div class="flex items-center justify-center gap-2 text-center">
				{#if game.thinking}
					<Status variant="warning" class="animate-pulse" />
				{/if}
				{#if viewIndex !== null}
					{i18n.t("viewingMove", {
						step: String(viewIndex),
						total: String(game.board.moves.length),
					})}
				{:else if game.phase === Phase.Finished}
					{#if game.winner}
						<span class="flex items-center gap-1 font-medium">
							{i18n.t("winnerPrefix")}
							<PieceSymbol color={game.winner} class="size-5" />
							{i18n.t("winnerSuffix", { seat: i18n.t(game.seatFor(game.winner)) })}
						</span>
					{:else}
						{i18n.t("draw")}
					{/if}
				{:else if game.thinking}
					{i18n.t("thinking")}
				{:else if game.phase === Phase.Opening}
					{i18n.t("opening", { seat: i18n.t(Seat.Player1), piece: pieceWord })}
				{:else if game.decisionSeat}
					{i18n.t("deciding", { seat: i18n.t(game.decisionSeat) })}
				{:else if game.phase === Phase.Balance}
					{i18n.t("balance", { seat: i18n.t(Seat.Player2), piece: pieceWord })}
				{:else}
					<span class="flex items-center gap-1">
						{i18n.t("turnPrefix")}
						<PieceSymbol color={game.nextColor} class="size-5" />
						({i18n.t(game.seatFor(game.nextColor))})
					</span>
				{/if}
			</div>
		</Card>
	{/if}

	<Button
		size="sm"
		disabled={!canViewForward}
		aria-label={i18n.t("viewNext")}
		onclick={viewForward}
	>
		<ChevronRightIcon class="size-5 fill-current" />
	</Button>

	{#if Settings.value.confirmMoves}
		<Button
			size="sm"
			variant={canConfirmMove ? "success" : undefined}
			disabled={!canConfirmMove}
			aria-label={i18n.t("confirmMove")}
			onclick={confirmMove}
		>
			<CheckIcon class="size-5 fill-current" />
		</Button>
	{/if}
</div>

<div class="flex min-h-0 flex-1 overflow-auto items-center-safe justify-center-safe">
	{#if Settings.value.boardStyle === BoardStyle.Piskvorky}
		<PiskvorkyBoard
			board={viewBoard}
			disabled={boardDisabled}
			selected={pendingMove}
			onPlay={play}
		/>
	{:else}
		<GomokuBoard
			board={viewBoard}
			disabled={boardDisabled}
			selected={pendingMove}
			onPlay={play}
		/>
	{/if}
</div>
