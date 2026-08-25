<script lang="ts">
	import { goto } from "$app/navigation";
	import SettingsPanel from "$lib/components/SettingsPanel.svelte";
</script>

<SettingsPanel onBack={() => goto("/")} />
