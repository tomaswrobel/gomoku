<script lang="ts">
	import Card from "@juvofy/lib/components/display/Card";
	import { i18nContext } from "$lib/i18n/i18nContext.ts";
	import type { PageProps } from "./$types";

	const { data }: PageProps = $props();

	const i18n = i18nContext.get();
</script>

<div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
	{#each data.tables as table (table.id)}
		<a href="/rooms/{table.id}">
			<Card decoration="border">
				<div class="flex items-center justify-between">
					<span class="font-medium">{i18n.t("table")} {table.id}</span>
					<span class="text-sm opacity-60">{table.seats.length}/2</span>
				</div>
			</Card>
		</a>
	{/each}
</div>
