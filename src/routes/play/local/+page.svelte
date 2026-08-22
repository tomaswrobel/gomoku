<script lang="ts">
	import BoardSection from "$lib/components/Board.svelte";
	import SetupPanel from "$lib/components/SetupPanel.svelte";
	import { StorageState } from "$lib/settings/StorageState.svelte";
	import { Controller } from "$lib/game/Controller.ts";
	import { Game } from "$lib/game/Game.svelte";
	import type { PersistedGame } from "$lib/game/PersistedGame.ts";
	import { Phase } from "$lib/game/Phase.ts";
	import { Seat } from "$lib/game/Seat.ts";
	import { Settings } from "$lib/settings/settings.ts";

	const persistedGame = new StorageState<PersistedGame | null>("local", "gomoku:game", null);

	let setupControllers = $state<Record<Seat, Controller>>({
		[Seat.Player1]: Controller.Human,
		[Seat.Player2]: Controller.Computer,
	});
	let game = $state<Game | null>(null);

	// Resume whatever game was in progress when the page was last closed/reloaded.
	if (persistedGame.value && persistedGame.value.phase !== Phase.Finished) {
		const restored = Game.restore(persistedGame.value);
		game = restored;
		void restored.resume();
	}

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
		const nextGame = new Game(
			Settings.value.openingRule,
			structuredClone($state.snapshot(setupControllers)),
		);
		game = nextGame;
		void nextGame.start();
	}

	function backToSetup() {
		game?.destroy();
		game = null;
	}
</script>

{#if !game}
	<SetupPanel bind:controllers={setupControllers} onNewGame={newGame} />
{:else}
	<BoardSection {game} onBackToSetup={backToSetup} />
{/if}
