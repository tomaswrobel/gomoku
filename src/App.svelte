<script lang="ts">
	import App from "@juvofy/lib/App";
	import Button from "@juvofy/lib/components/actions/Button";
	import Card from "@juvofy/lib/components/display/Card";
	import SettingsIcon from "@material-symbols/svg-400/rounded/settings.svg?icon";
	import HistoryIcon from "@material-symbols/svg-400/rounded/history.svg?icon";
	import BoardSection from "./components/Board.svelte";
	import HistoryPanel from "./components/HistoryPanel.svelte";
	import SettingsPanel from "./components/SettingsPanel.svelte";
	import Logo from "./Logo.svelte";
	import { StorageState } from "./StorageState.svelte";
	import { Controller } from "./Controller";
	import { SwapTwoGame } from "./Game.svelte";
	import { i18nContext } from "./i18nContext";
	import { t } from "./i18n";
	import type { PersistedGame } from "./PersistedGame";
	import { Phase } from "./Phase";
	import { Seat } from "./Seat";
	import { Settings } from "./settings";

	const locale = $derived(Settings.value.locale);
	i18nContext.set({
		get locale() {
			return locale;
		},
		t: (key, vars) => t(key, locale, vars),
	});

	const persistedGame = new StorageState<PersistedGame | null>("local", "gomoku:game", null);

	let settingsOpen = $state(false);
	let historyOpen = $state(false);
	let setupControllers = $state<Record<Seat, Controller>>({
		[Seat.Player1]: Controller.Human,
		[Seat.Player2]: Controller.Computer,
	});
	let game = $state<SwapTwoGame | null>(null);

	// Resume whatever game was in progress when the page was last closed/reloaded.
	if (persistedGame.value && persistedGame.value.phase !== Phase.Finished) {
		const restored = SwapTwoGame.restore(persistedGame.value);
		game = restored;
		void restored.resume();
	}

	$effect(() => {
		document.documentElement.dataset.theme = Settings.value.theme;
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
		void nextGame.start();
	}

	function backToSetup() {
		game?.destroy();
		game = null;
	}
</script>

<App>
	<div class="navbar bg-base-100 shadow-sm fixed top-0">
		<div class="flex flex-1 items-center gap-2 pl-1">
			<Logo class="size-8 sm:h-10 sm:w-10" />
			<h1 class="text-xl font-bold sm:text-2xl">{t("title", locale)}</h1>
		</div>
		<div class="flex flex-none items-center gap-2 pr-1">
			{#if game}
				<Button
					size="sm"
					aria-label={t("history", locale)}
					onclick={() => {
						historyOpen = !historyOpen;
						settingsOpen = false;
					}}
				>
					<HistoryIcon class="size-5 fill-current" />
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
				<SettingsIcon class="size-5 fill-current" />
			</Button>
		</div>
	</div>
	<div
		class="mx-auto flex h-dvh w-full max-w-xl flex-col gap-3 overflow-hidden p-2 sm:max-w-2xl sm:gap-4 sm:p-4 lg:max-w-3xl"
	>
		<div class="navbar"></div>
		{#if historyOpen}
			<HistoryPanel {game} onBack={() => (historyOpen = false)} />
		{:else if settingsOpen}
			<SettingsPanel onBack={() => (settingsOpen = false)} />
		{:else if !game}
			<Card decoration="border">
				<div class="flex flex-col gap-4">
					{#each Object.values(Seat) as seat (seat)}
						<div class="flex flex-wrap items-center justify-between gap-2">
							<span class="font-medium">{t(seat, locale)}</span>
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
										{t(controller, locale)}
									</Button>
								{/each}
							</div>
						</div>
					{/each}

					<Button variant="primary" onclick={newGame}>{t("newGame", locale)}</Button>
				</div>
			</Card>
		{:else}
			<BoardSection {game} onBackToSetup={backToSetup} />
		{/if}
	</div>
</App>
