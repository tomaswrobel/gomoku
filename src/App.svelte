<script lang="ts">
	import App from "@juvofy/lib/App";
	import Button from "@juvofy/lib/components/actions/Button";
	import Badge from "@juvofy/lib/components/display/Badge";
	import Card from "@juvofy/lib/components/display/Card";
	import Status from "@juvofy/lib/components/display/Status";
	import SettingsIcon from "@material-symbols/svg-400/rounded/settings.svg?icon";
	import BackIcon from "@material-symbols/svg-400/rounded/arrow_back.svg?icon";
	import HistoryIcon from "@material-symbols/svg-400/rounded/history.svg?icon";
	import ChevronLeftIcon from "@material-symbols/svg-400/rounded/chevron_left.svg?icon";
	import ChevronRightIcon from "@material-symbols/svg-400/rounded/chevron_right.svg?icon";
	import MailIcon from "@material-symbols/svg-400/rounded/mail.svg?icon";
	import LinkIcon from "@material-symbols/svg-400/rounded/link.svg?icon";
	import BoardView from "./GomokuBoard.svelte";
	import Logo from "./Logo.svelte";
	import ThemeChooser from "./ThemeChooser.svelte";
	import { StorageState } from "./StorageState.svelte";
	import { Board } from "./Board.svelte";
	import { Color } from "./Color";
	import { Controller } from "./Controller";
	import { Decision } from "./Decision";
	import { detectLocale } from "./detectLocale";
	import { SwapTwoGame } from "./Game.svelte";
	import { Locale } from "./Locale";
	import type { PersistedGame } from "./PersistedGame";
	import { Phase } from "./Phase";
	import { Seat } from "./Seat";
	import { t } from "./i18n";
	import { Theme } from "./Theme";
	import packageJson from "../package.json";

	const author = packageJson.author;

	interface Settings {
		locale: Locale;
		theme: Theme;
	}

	const settings = new StorageState<Settings>("local", "gomoku:settings", {
		locale: detectLocale(),
		theme: Theme.Forest,
	});
	const locale = $derived(settings.value.locale);
	const theme = $derived(settings.value.theme);

	const persistedGame = new StorageState<PersistedGame | null>("local", "gomoku:game", null);

	let settingsOpen = $state(false);
	let historyOpen = $state(false);
	let setupControllers = $state<Record<Seat, Controller>>({
		[Seat.Black]: Controller.Human,
		[Seat.White]: Controller.Computer,
	});
	let game = $state<SwapTwoGame | null>(null);

	// null = looking at the live position; otherwise the number of moves currently shown, so the
	// left/right arrows next to the status bar can step through history without touching the game.
	let viewIndex = $state<number | null>(null);

	const viewBoard = $derived.by(() => {
		if (!game) return new Board();
		if (viewIndex === null) return game.board;
		return new Board(game.board.moves.slice(0, viewIndex));
	});
	const canViewBack = $derived(!!game && (viewIndex ?? game.board.moves.length) > 0);
	const canViewForward = $derived(viewIndex !== null);

	function viewBack() {
		if (!game || !canViewBack) return;
		viewIndex = (viewIndex ?? game.board.moves.length) - 1;
	}

	function viewForward() {
		if (!game || viewIndex === null) return;
		const next = viewIndex + 1;
		viewIndex = next >= game.board.moves.length ? null : next;
	}

	// Resume whatever game was in progress when the page was last closed/reloaded.
	if (persistedGame.value && persistedGame.value.phase !== Phase.Finished) {
		const restored = SwapTwoGame.restore(persistedGame.value);
		game = restored;
		void restored.resume();
	}

	$effect(() => {
		document.documentElement.dataset.theme = theme;
	});

	// Keep the active game persisted so a reload doesn't lose it; drop it once there's no game
	// to resume (back to setup) or the game has finished.
	$effect(() => {
		if (!game || game.phase === Phase.Finished) {
			persistedGame.value = null;
		} else {
			persistedGame.value = structuredClone($state.snapshot(game));
		}
	});

	function newGame() {
		game?.destroy();
		const nextGame = new SwapTwoGame();
		nextGame.controllers = { ...setupControllers };
		game = nextGame;
		viewIndex = null;
		void nextGame.start();
	}

	function backToSetup() {
		game?.destroy();
		game = null;
	}

	function colorLabel(color: Color) {
		return t(color === Color.Black ? "blackColor" : "whiteColor", locale);
	}

	function seatLabel(seat: Seat) {
		return t(seat === Seat.Black ? "player1" : "player2", locale);
	}

	function controllerLabel(controller: Controller) {
		return t(controller === Controller.Human ? "human" : "computer", locale);
	}

	function isSeatActive(seat: Seat): boolean {
		if (!game || game.phase === Phase.Finished) return false;
		if (game.phase === Phase.Opening) return seat === Seat.Black;
		if (game.decisionSeat) return seat === game.decisionSeat;
		if (game.phase === Phase.Balance) return seat === Seat.White;
		return seat === game.seatFor(game.nextColor);
	}
</script>

<App>
	<div
		class="mx-auto flex h-dvh w-full max-w-xl flex-col gap-3 overflow-hidden p-2 sm:max-w-2xl sm:gap-4 sm:p-4 lg:max-w-3xl"
	>
		<div class="flex shrink-0 items-center justify-between gap-2">
			<div class="flex items-center gap-2">
				<Logo class="h-8 w-8 sm:h-10 sm:w-10" />
				<h1 class="text-xl font-bold sm:text-2xl">{t("title", locale)}</h1>
			</div>
			<div class="flex items-center gap-2">
				{#if game}
					<Button
						size="sm"
						aria-label={t("history", locale)}
						onclick={() => {
							historyOpen = !historyOpen;
							settingsOpen = false;
						}}
					>
						<HistoryIcon class="h-5 w-5 fill-current" />
					</Button>
				{/if}
				<Button
					size="sm"
					aria-label={t("settings", locale)}
					onclick={() => {
						settingsOpen = !settingsOpen;
						historyOpen = false;
					}}
				>
					<SettingsIcon class="h-5 w-5 fill-current" />
				</Button>
			</div>
		</div>

		{#if historyOpen}
			<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
				<Card decoration="border">
					<h2 class="mb-2 font-medium">{t("history", locale)}</h2>
					{#if !game || game.board.moves.length === 0}
						<p class="text-sm opacity-60">{t("noMoves", locale)}</p>
					{:else}
						<div
							class="grid grid-cols-[auto_1fr_1fr] items-baseline gap-x-3 gap-y-1 text-sm"
						>
							<span></span>
							<span class="font-medium opacity-60">{t("blackLabel", locale)}</span>
							<span class="font-medium opacity-60">{t("whiteLabel", locale)}</span>
							{#each { length: Math.ceil(game.board.moves.length / 2) } as _, row (row)}
								<span class="opacity-60">{row + 1}.</span>
								<span>{game.board.moves[row * 2] ?? ""}</span>
								<span>{game.board.moves[row * 2 + 1] ?? ""}</span>
							{/each}
						</div>
					{/if}
				</Card>

				<Button onclick={() => (historyOpen = false)}>
					<BackIcon class="h-5 w-5 fill-current" />
					{t("back", locale)}
				</Button>
			</div>
		{:else if settingsOpen}
			<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
				<Card decoration="border">
					<h2 class="mb-2 font-medium">{t("language", locale)}</h2>
					<div class="join">
						{#each Object.values(Locale) as candidate (candidate)}
							<Button
								size="sm"
								variant={candidate === locale ? "primary" : undefined}
								class="join-item uppercase"
								onclick={() => (settings.value.locale = candidate)}
							>
								{candidate}
							</Button>
						{/each}
					</div>
				</Card>

				<Card decoration="border">
					<h2 class="mb-2 font-medium">{t("appearance", locale)}</h2>
					<ThemeChooser bind:value={settings.value.theme} />
				</Card>

				<Card decoration="border">
					<h2 class="mb-2 font-medium">{t("about", locale)}</h2>
					<div class="flex flex-col gap-1 text-sm">
						<span class="font-medium">{author.name}</span>
						<a
							class="link link-hover flex items-center gap-1.5"
							href="mailto:{author.email}"
						>
							<MailIcon class="h-4 w-4 fill-current" />
							{author.email}
						</a>
						<a
							class="link link-hover flex items-center gap-1.5"
							href={author.url}
							target="_blank"
							rel="noreferrer"
						>
							<LinkIcon class="h-4 w-4 fill-current" />
							{author.url}
						</a>
						<span class="mt-1 opacity-60">
							{t("version", locale, { version: packageJson.version })}
						</span>
					</div>
				</Card>

				<Button onclick={() => (settingsOpen = false)}>
					<BackIcon class="h-5 w-5 fill-current" />
					{t("back", locale)}
				</Button>
			</div>
		{:else if !game}
			<Card decoration="border">
				<div class="flex flex-col gap-4">
					{#each Object.values(Seat) as seat (seat)}
						<div class="flex flex-wrap items-center justify-between gap-2">
							<span class="font-medium">{seatLabel(seat)}</span>
							<div class="join">
								{#each Object.values(Controller) as controller (controller)}
									<Button
										size="sm"
										variant={setupControllers[seat] === controller
											? "primary"
											: undefined}
										class="join-item"
										onclick={() => (setupControllers[seat] = controller)}
									>
										{controllerLabel(controller)}
									</Button>
								{/each}
							</div>
						</div>
					{/each}

					<Button variant="primary" onclick={newGame}>{t("newGame", locale)}</Button>
				</div>
			</Card>
		{:else}
			<div class="flex shrink-0 flex-col items-center justify-between gap-2 sm:flex-row">
				<Badge
					variant={isSeatActive(Seat.Black) ? "primary" : undefined}
					decoration="outline"
				>
					{seatLabel(Seat.Black)} · {controllerLabel(game.controllers[Seat.Black])}
				</Badge>
				<Button size="sm" onclick={backToSetup}>{t("newGame", locale)}</Button>
				<Badge
					variant={isSeatActive(Seat.White) ? "primary" : undefined}
					decoration="outline"
				>
					{seatLabel(Seat.White)} · {controllerLabel(game.controllers[Seat.White])}
				</Badge>
			</div>

			<div class="flex shrink-0 items-center gap-2">
				<Button
					size="sm"
					disabled={!canViewBack}
					aria-label={t("viewPrevious", locale)}
					onclick={viewBack}
				>
					<ChevronLeftIcon class="h-5 w-5 fill-current" />
				</Button>

				<Card decoration="border" size="sm" class="min-w-0 flex-1">
					<div class="flex items-center justify-center gap-2 text-center">
						{#if game.thinking}
							<Status variant="warning" class="animate-pulse" />
						{/if}
						{#if viewIndex !== null}
							{t("viewingMove", locale, {
								step: String(viewIndex),
								total: String(game.board.moves.length),
							})}
						{:else if game.phase === Phase.Finished}
							{#if game.winner}
								<span class="font-medium">
									{t("winner", locale, {
										color: colorLabel(game.winner),
										seat: seatLabel(game.seatFor(game.winner)),
									})}
								</span>
							{:else}
								{t("draw", locale)}
							{/if}
						{:else if game.thinking}
							{t("thinking", locale)}
						{:else if game.phase === Phase.Opening}
							{t("opening", locale, { seat: seatLabel(Seat.Black) })}
						{:else if game.decisionSeat}
							{t("deciding", locale, { seat: seatLabel(game.decisionSeat) })}
						{:else if game.phase === Phase.Balance}
							{t("balance", locale, { seat: seatLabel(Seat.White) })}
						{:else}
							{t("turn", locale, {
								color: colorLabel(game.nextColor),
								seat: seatLabel(game.seatFor(game.nextColor)),
							})}
						{/if}
					</div>
				</Card>

				<Button
					size="sm"
					disabled={!canViewForward}
					aria-label={t("viewNext", locale)}
					onclick={viewForward}
				>
					<ChevronRightIcon class="h-5 w-5 fill-current" />
				</Button>
			</div>

			{#if viewIndex === null && game.decisionSeat && game.controllers[game.decisionSeat] === Controller.Human}
				<div class="flex shrink-0 flex-wrap justify-center gap-2">
					<Button variant="neutral" onclick={() => game?.decide(Decision.Keep)}>
						{t("keep", locale, { color: colorLabel(game.nextColor) })}
					</Button>
					<Button variant="neutral" onclick={() => game?.decide(Decision.Swap)}>
						{t("swap", locale, {
							color: colorLabel(
								game.nextColor === Color.Black ? Color.White : Color.Black,
							),
						})}
					</Button>
					{#if game.phase === Phase.Decide1}
						<Button variant="neutral" onclick={() => game?.placeTwoMore()}>
							{t("placeTwoMore", locale)}
						</Button>
					{/if}
				</div>
			{/if}

			<div
				class="flex min-h-0 flex-1 overflow-auto [align-items:safe_center] [justify-content:safe_center]"
			>
				<BoardView
					board={viewBoard}
					disabled={viewIndex !== null || game.thinking}
					onPlay={(coordinate) => game?.humanPlay(coordinate)}
				/>
			</div>
		{/if}
	</div>
</App>
