import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { svgPlugin } from "@juvofy/lib/vite/svgPlugin";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss(),
		svgPlugin("icon"),
		SvelteKitPWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.svg"],
			manifest: {
				name: "Gomoku Lite",
				short_name: "Gomoku Lite",
				description:
					"A lightweight Gomoku app playable against the Rapfi engine, with Swap2 or standard openings.",
				theme_color: "#1fb854",
				background_color: "#1b1717",
				display: "standalone",
				icons: [
					{ src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
					{ src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
					{
						src: "maskable-icon-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
				screenshots: [
					{
						src: "screenshots/wide.png",
						sizes: "1280x800",
						type: "image/png",
						form_factor: "wide",
						label: "Playing against Rapfi on desktop",
					},
					{
						src: "screenshots/narrow.png",
						sizes: "750x1334",
						type: "image/png",
						form_factor: "narrow",
						label: "Playing against Rapfi on mobile",
					},
				],
			},
			workbox: {
				// Rapfi's WASM module + preloaded network weights are ~11MB combined and must be
				// precached for the engine to work fully offline.
				globPatterns: ["**/*.{js,css,html,ico,png,svg,wasm,data,webmanifest}"],
				maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
			},
		}),
	],
});
