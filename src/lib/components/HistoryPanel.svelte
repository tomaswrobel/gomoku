<script lang="ts">
	import Button from "@juvofy/lib/components/actions/Button";
	import Card from "@juvofy/lib/components/display/Card";
	import BackIcon from "@material-symbols/svg-400/rounded/arrow_back.svg?icon";
	import { i18nContext } from "../i18n/i18nContext.ts";
	import type { Game } from "../game/Game.svelte";

	const { game, onBack }: { game: Game | null; onBack(): void } = $props();

	const i18n = i18nContext.get();
</script>

<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
	<Card decoration="border">
		<h2 class="mb-2 font-medium">{i18n.t("history")}</h2>
		{#if !game || game.board.moves.length === 0}
			<p class="text-sm opacity-60">{i18n.t("noMoves")}</p>
		{:else}
			<div class="grid grid-cols-[auto_1fr_1fr] items-baseline gap-x-3 gap-y-1 text-sm">
				<span></span>
				<span class="font-medium opacity-60">{i18n.t("blackLabel")}</span>
				<span class="font-medium opacity-60">{i18n.t("whiteLabel")}</span>
				{#each { length: Math.ceil(game.board.moves.length / 2) } as _, row (row)}
					<span class="opacity-60">{row + 1}.</span>
					<span>{game.board.moves[row * 2] ?? ""}</span>
					<span>{game.board.moves[row * 2 + 1] ?? ""}</span>
				{/each}
			</div>
		{/if}
	</Card>

	<Button onclick={onBack}>
		<BackIcon class="size-5 fill-current" />
		{i18n.t("back")}
	</Button>
</div>
