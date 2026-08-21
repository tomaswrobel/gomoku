<script lang="ts">
	import { Theme } from "../settings/Theme";

	let { value = $bindable() }: { value: Theme } = $props();
</script>

<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
	{#each Object.values(Theme) as candidate (candidate)}
		<button
			type="button"
			data-theme={candidate}
			class={[
				"bg-base-100 text-base-content rounded-box border-2 p-3 transition-colors",
				value === candidate
					? "border-primary"
					: "border-base-content/10 hover:border-base-content/30 cursor-pointer",
			]}
			onclick={() => {
				value = candidate;
			}}
		>
			<span class="relative mx-auto mb-2 block h-5 w-6">
				<span
					class="bg-primary absolute top-0 left-1/2 size-2 -translate-x-1/2 rounded-full"
				></span>
				<span class="bg-secondary absolute bottom-0 left-0 size-2 rounded-full"></span>
				<span class="bg-accent absolute right-0 bottom-0 size-2 rounded-full"></span>
			</span>
			<span class="block text-center text-xs font-medium capitalize">{candidate}</span>
		</button>
	{/each}
</div>
