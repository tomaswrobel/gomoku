/// <reference types="vite/client" />

declare module "*?icon" {
	import type { IconComponent } from "@juvofy/lib/components/IconComponent";

	const Icon: IconComponent;
	export default Icon;
}
