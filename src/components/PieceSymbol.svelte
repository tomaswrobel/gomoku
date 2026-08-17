<script lang="ts">
	import { BoardStyle } from "../settings/BoardStyle";
	import { Color } from "../game/Color";
	import { Settings } from "../settings/settings";

	const { color, class: className = "size-5" }: { color: Color; class?: string } = $props();

	const boardStyle = $derived(Settings.value.boardStyle);
</script>

{#if boardStyle === BoardStyle.Piskvorky}
	{#if color === Color.Black}
		<svg viewBox="0 0 24 24" class={className}>
			<path
				d="M5 5L19 19M19 5L5 19"
				fill="none"
				class="stroke-primary"
				stroke-width="3"
				stroke-linecap="round"
			/>
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" class={className}>
			<circle cx="12" cy="12" r="7.5" fill="none" class="stroke-secondary" stroke-width="3" />
		</svg>
	{/if}
{:else}
	<svg viewBox="0 0 24 24" class={className}>
		<circle
			cx="12"
			cy="12"
			r="9"
			class={color === Color.Black ? "fill-neutral" : "fill-neutral-content"}
			stroke="currentColor"
			stroke-opacity="0.3"
		/>
	</svg>
{/if}
