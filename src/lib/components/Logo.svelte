<script lang="ts">
	import LogoIcon from "../assets/logo.svg?icon";

	let { class: className = "" }: { class?: string } = $props();
</script>

<LogoIcon class={className} aria-hidden="true" />
