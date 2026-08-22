<script lang="ts">
	import type { Board } from "../game/Board.svelte";
	import { Color } from "../game/Color.ts";
	import { colorAtMove } from "../game/colorAtMove.ts";
	import { tw } from "@juvofy/lib/utils/tw";
	import type { ClassValue } from "svelte/elements";
	import type { Coordinate } from "../game/coordinate/Coordinate.js";
	import { boardSize } from "../game/boardSize.js";
	import { Horizontal } from "../game/coordinate/Horizontal.js";
	import {
		BoardInteraction,
		coordinateAt,
		MARGIN_BOTTOM,
		MARGIN_TOP,
		MARGIN_X,
		MIN_CELL_SIZE_PX,
	} from "./boardShared.svelte";

	const {
		board,
		onPlay = board.play.bind(board),
		disabled = false,
		selected,
	}: {
		board: Board;
		onPlay(this: void, coordinate: Coordinate): void;
		disabled?: boolean;
		selected?: Coordinate;
	} = $props();

	// Unlike GomokuBoard, pieces live inside cells, not on grid intersections, so the grid spans
	// boardSize cells (not boardSize - 1 gaps) and coordinate labels sit outside that extra cell.
	const viewBoxWidth = boardSize + MARGIN_X * 2;
	const viewBoxHeight = boardSize + MARGIN_TOP + MARGIN_BOTTOM;
	const minWidth = viewBoxWidth * MIN_CELL_SIZE_PX;
	const minHeight = viewBoxHeight * MIN_CELL_SIZE_PX;

	const style = {
		markStrokeWidth: 0.09,
		markRadius: 0.32,
		markPad: 0.22,
		hoverAlpha: 0.4,
	};

	const markColors: Record<Color, ClassValue> = {
		[Color.Black]: tw("stroke-primary"),
		[Color.White]: tw("stroke-secondary"),
	};

	const interaction = new BoardInteraction({
		board: () => board,
		disabled: () => disabled,
		onPlay: (coordinate) => onPlay(coordinate),
	});

	const nextColor = $derived(colorAtMove(board.moves.length));

	function isPreview(coordinate: Coordinate): boolean {
		if (disabled || board.board[coordinate]) {
			return false;
		}
		return coordinate === selected || coordinate === interaction.hoverCoordinate;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -- mouse-driven board; each cell is its own button -->
<svg
	style:-webkit-tap-highlight-color="transparent"
	style:min-width="{minWidth}px"
	style:min-height="{minHeight}px"
	viewBox="0 0 {viewBoxWidth} {viewBoxHeight}"
	class={[
		"mx-auto block h-full max-h-full w-full max-w-full touch-manipulation select-none",
		!disabled && "cursor-pointer",
	]}
	onpointerleave={interaction.clearHover}
	oncontextmenu={(event) => event.preventDefault()}
>
	<!-- Covers the full viewBox (not just the grid) so the coordinate labels sit on the board
	     background instead of being clipped against the page background outside it. -->
	<rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} rx="0.3" class="fill-base-200" />

	{#each { length: boardSize } as _, i}
		<text
			x={MARGIN_X - 0.75}
			y={MARGIN_TOP + i + 0.5}
			font-size="0.35"
			class="fill-base-content"
			text-anchor="middle"
			dominant-baseline="central"
		>
			{boardSize - i}
		</text>
		<text
			x={MARGIN_X + boardSize + 0.75}
			y={MARGIN_TOP + i + 0.5}
			font-size="0.35"
			class="fill-base-content"
			text-anchor="middle"
			dominant-baseline="central"
		>
			{boardSize - i}
		</text>
		<text
			x={MARGIN_X + i + 0.5}
			y={MARGIN_TOP + boardSize + 0.75}
			font-size="0.35"
			class="fill-base-content"
			text-anchor="middle"
			dominant-baseline="central"
		>
			{Horizontal[i]}
		</text>
	{/each}

	<!-- Grid lines delimit cells (boardSize + 1 lines), not intersections, so marks are placed
	     inside the squares they form. -->
	{#each { length: boardSize + 1 } as _, i}
		<line
			x1={MARGIN_X + i}
			y1={MARGIN_TOP}
			x2={MARGIN_X + i}
			y2={MARGIN_TOP + boardSize}
			class="stroke-base-content"
			stroke-width="0.03"
		/>
		<line
			x1={MARGIN_X}
			y1={MARGIN_TOP + i}
			x2={MARGIN_X + boardSize}
			y2={MARGIN_TOP + i}
			class="stroke-base-content"
			stroke-width="0.03"
		/>
	{/each}
	<rect
		x={MARGIN_X}
		y={MARGIN_TOP}
		width={boardSize}
		height={boardSize}
		fill="none"
		class="stroke-base-content"
		stroke-width="0.075"
	/>

	<!-- Every cell keeps its click/hover target permanently in the DOM; the mark (X or O) is drawn
	     only once a stone/hover preview is present. -->
	{#each { length: boardSize } as _, row (row)}
		{#each { length: boardSize } as _, col (col)}
			{@const coordinate = coordinateAt(col, row)}
			{@const color = board.board[coordinate]}
			{@const cx = MARGIN_X + col + 0.5}
			{@const cy = MARGIN_TOP + row + 0.5}
			{@const preview = isPreview(coordinate)}
			{@const markColor = color ?? (preview ? nextColor : undefined)}
			<!-- svelte-ignore a11y_click_events_have_key_events -- 225 cells; not keyboard-navigable -->
			<!-- svelte-ignore a11y_no_static_element_interactions -- see above -->
			<g
				onclick={() => interaction.onCellClick(coordinate)}
				onpointerenter={() => interaction.onCellEnter(coordinate)}
			>
				<rect
					x={MARGIN_X + col}
					y={MARGIN_TOP + row}
					width="1"
					height="1"
					fill="transparent"
				/>

				{#if coordinate === selected}
					<rect
						x={MARGIN_X + col + 0.04}
						y={MARGIN_TOP + row + 0.04}
						width="0.92"
						height="0.92"
						rx="0.08"
						fill="none"
						class="stroke-primary"
						stroke-width="0.05"
					/>
				{/if}

				{#if markColor === Color.Black}
					<!-- Cross (X) -->
					<g
						opacity={color ? 1 : style.hoverAlpha}
						class={markColors[Color.Black]}
						stroke-width={style.markStrokeWidth}
						stroke-linecap="round"
					>
						<line
							x1={cx - style.markPad}
							y1={cy - style.markPad}
							x2={cx + style.markPad}
							y2={cy + style.markPad}
						/>
						<line
							x1={cx + style.markPad}
							y1={cy - style.markPad}
							x2={cx - style.markPad}
							y2={cy + style.markPad}
						/>
					</g>
				{:else if markColor === Color.White}
					<!-- Circle (O) -->
					<circle
						{cx}
						{cy}
						r={style.markRadius}
						fill="none"
						opacity={color ? 1 : style.hoverAlpha}
						class={markColors[Color.White]}
						stroke-width={style.markStrokeWidth}
					/>
				{/if}
			</g>
		{/each}
	{/each}
</svg>
