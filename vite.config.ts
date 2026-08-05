import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { svgPlugin } from "@juvofy/lib/vite/svgPlugin";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		svelte(),
		tailwindcss(),
		svgPlugin("icon"),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.svg"],
			manifest: {
				name: "Gomoku — Swap2",
				short_name: "Gomoku",
				description:
					"Gomoku locked to the Swap2 opening, playable against the Rapfi engine.",
				theme_color: "#dcb35c",
				background_color: "#dcb35c",
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
