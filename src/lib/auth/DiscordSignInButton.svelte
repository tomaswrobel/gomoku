<script lang="ts">
	import Button from "@juvofy/lib/components/actions/Button";
	import { i18nContext } from "$lib/i18n/i18nContext";
	import { createSupabaseBrowserClient } from "$lib/supabase/client";

	const i18n = i18nContext.get();

	async function signIn() {
		const supabase = createSupabaseBrowserClient();
		await supabase.auth.signInWithOAuth({
			provider: "discord",
			options: { redirectTo: `${window.location.origin}/auth/callback` },
		});
	}
</script>

<Button size="sm" onclick={signIn}>
	{i18n.t("signInWithDiscord")}
</Button>
