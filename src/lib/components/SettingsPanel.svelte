<script lang="ts">
	import Button from "@juvofy/lib/components/actions/Button";
	import Card from "@juvofy/lib/components/display/Card";
	import BackIcon from "@material-symbols/svg-400/rounded/arrow_back.svg?icon";
	import MailIcon from "@material-symbols/svg-400/rounded/mail.svg?icon";
	import LinkIcon from "@material-symbols/svg-400/rounded/link.svg?icon";
	import ThemeChooser from "./ThemeChooser.svelte";
	import { BoardStyle } from "../settings/BoardStyle.ts";
	import { Difficulty } from "../settings/Difficulty.ts";
	import { i18nContext } from "../i18n/i18nContext.ts";
	import { Locale } from "../i18n/Locale.ts";
	import { OpeningRule } from "../game/OpeningRule.ts";
	import { Settings } from "../settings/settings.ts";
	import packageJson from "../../../package.json";

	const { onBack }: { onBack(): void } = $props();

	const i18n = i18nContext.get();
	const author = packageJson.author;
</script>

<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
	<Card decoration="border">
		<h2 class="mb-2 font-medium">{i18n.t("language")}</h2>
		<div class="join">
			{#each Object.values(Locale) as candidate (candidate)}
				<Button
					size="sm"
					variant={candidate === i18n.locale ? "primary" : undefined}
					class="join-item uppercase"
					onclick={() => (Settings.value.locale = candidate)}
				>
					{candidate}
				</Button>
			{/each}
		</div>
	</Card>

	<Card decoration="border">
		<h2 class="mb-2 font-medium">{i18n.t("gameplay")}</h2>
		<div class="flex flex-col gap-3">
			<label class="flex cursor-pointer items-center justify-between gap-2">
				<span>{i18n.t("confirmMoves")}</span>
				<input
					type="checkbox"
					class="toggle toggle-primary"
					bind:checked={Settings.value.confirmMoves}
				/>
			</label>

			<label class="flex cursor-pointer items-center justify-between gap-2">
				<span>{i18n.t("overlineWins")}</span>
				<input
					type="checkbox"
					class="toggle toggle-primary"
					bind:checked={Settings.value.overlineWins}
				/>
			</label>

			<div class="flex flex-wrap items-center justify-between gap-2">
				<span>{i18n.t("openingRule")}</span>
				<div class="join">
					{#each Object.values(OpeningRule) as candidate (candidate)}
						<Button
							size="sm"
							variant={candidate === Settings.value.openingRule
								? "primary"
								: undefined}
							class="join-item"
							onclick={() => (Settings.value.openingRule = candidate)}
						>
							{i18n.t(candidate)}
						</Button>
					{/each}
				</div>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-2">
				<span>{i18n.t("boardStyle")}</span>
				<div class="join">
					{#each Object.values(BoardStyle) as candidate (candidate)}
						<Button
							size="sm"
							variant={candidate === Settings.value.boardStyle
								? "primary"
								: undefined}
							class="join-item"
							onclick={() => (Settings.value.boardStyle = candidate)}
						>
							{i18n.t(candidate)}
						</Button>
					{/each}
				</div>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-2">
				<span>{i18n.t("difficulty")}</span>
				<div class="join">
					{#each Object.values(Difficulty) as candidate (candidate)}
						<Button
							size="sm"
							variant={candidate === Settings.value.difficulty
								? "primary"
								: undefined}
							class="join-item"
							onclick={() => (Settings.value.difficulty = candidate)}
						>
							{i18n.t(candidate)}
						</Button>
					{/each}
				</div>
			</div>
		</div>
	</Card>

	<Card decoration="border">
		<h2 class="mb-2 font-medium">{i18n.t("appearance")}</h2>
		<ThemeChooser bind:value={Settings.value.theme} />
	</Card>

	<Card decoration="border">
		<h2 class="mb-2 font-medium">{i18n.t("about")}</h2>
		<div class="flex flex-col gap-1 text-sm">
			<span class="font-medium">{author.name}</span>
			<a class="link link-hover flex items-center gap-1.5" href="mailto:{author.email}">
				<MailIcon class="size-4 fill-current" />
				{author.email}
			</a>
			<a
				class="link link-hover flex items-center gap-1.5"
				href={author.url}
				target="_blank"
				rel="noreferrer"
			>
				<LinkIcon class="size-4 fill-current" />
				{author.url}
			</a>
			<span class="mt-1 opacity-60"
				>{i18n.t("version", { version: packageJson.version })}</span
			>
		</div>
	</Card>

	<Button onclick={onBack}>
		<BackIcon class="size-5 fill-current" />
		{i18n.t("back")}
	</Button>
</div>
