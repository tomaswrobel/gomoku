<script lang="ts">
	import Button from "@juvofy/lib/components/actions/Button";
	import Card from "@juvofy/lib/components/display/Card";
	import { Controller } from "../game/Controller";
	import { i18nContext } from "../i18n/i18nContext";
	import { Seat } from "../game/Seat";

	let {
		controllers = $bindable(),
		onNewGame,
	}: {
		controllers: Record<Seat, Controller>;
		onNewGame(): void;
	} = $props();

	const i18n = i18nContext.get();
</script>

<Card decoration="border">
	<div class="flex flex-col gap-4">
		{#each Object.values(Seat) as seat (seat)}
			<div class="flex flex-wrap items-center justify-between gap-2">
				<span class="font-medium">{i18n.t(seat)}</span>
				<div class="join">
					{#each Object.values(Controller) as controller (controller)}
						<Button
							size="sm"
							variant={controllers[seat] === controller ? "primary" : undefined}
							class="join-item"
							onclick={() => (controllers[seat] = controller)}
						>
							{i18n.t(controller)}
						</Button>
					{/each}
				</div>
			</div>
		{/each}

		<Button variant="primary" onclick={onNewGame}>{i18n.t("newGame")}</Button>
	</div>
</Card>
