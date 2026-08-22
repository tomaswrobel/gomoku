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
		buildMoveIndex,
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

	const lastIndex = boardSize - 1;
	const viewBoxWidth = lastIndex + MARGIN_X * 2;
	const viewBoxHeight = lastIndex + MARGIN_TOP + MARGIN_BOTTOM;
	const minWidth = viewBoxWidth * MIN_CELL_SIZE_PX;
	const minHeight = viewBoxHeight * MIN_CELL_SIZE_PX;

	// Colors follow the active daisyUI theme (CSS variables), so the board re-colors with it.
	// The two stone colors use the neutral/neutral-content pair specifically because daisyUI
	// guarantees that pairing stays mutually readable across every theme.
	const style = {
		starRadius: 0.1,
		pieceStrokeWidth: 0.021,
		pieceRadius: 0.475,
		indexFontSize: 0.4,
		hoverAlpha: 0.4,
	};

	const pieceFillColors: Record<Color, ClassValue> = {
		[Color.Black]: tw("fill-neutral"),
		[Color.White]: tw("fill-neutral-content"),
	};

	const pieceTextColors: Record<Color, ClassValue> = {
		[Color.Black]: tw("fill-neutral-content"),
		[Color.White]: tw("fill-neutral"),
	};

	const interaction = new BoardInteraction({
		board: () => board,
		disabled: () => disabled,
		onPlay: (coordinate) => onPlay(coordinate),
	});

	const nextColor = $derived(colorAtMove(board.moves.length));
	const moveIndex = $derived.by(() => buildMoveIndex(board.moves));

	const starPoints = $derived.by<[number, number][]>(() => {
		const pad = Math.floor(boardSize / 5);
		const center = Math.floor(boardSize / 2);

		return [
			[pad, pad],
			[lastIndex - pad, pad],
			[pad, lastIndex - pad],
			[lastIndex - pad, lastIndex - pad],
			[center, center],
		];
	});

	function getCellFillColor(coordinate: Coordinate, color: Color | undefined): ClassValue {
		if (color) {
			return pieceFillColors[color];
		}
		if (coordinate === selected) {
			return pieceFillColors[nextColor];
		}
		if (!disabled && coordinate === interaction.hoverCoordinate) {
			return pieceFillColors[nextColor];
		}
		return tw("fill-transparent");
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
			y={MARGIN_TOP + i}
			font-size="0.35"
			class="fill-base-content"
			text-anchor="middle"
			dominant-baseline="central"
		>
			{boardSize - i}
		</text>
		<text
			x={MARGIN_X + lastIndex + 0.75}
			y={MARGIN_TOP + i}
			font-size="0.35"
			class="fill-base-content"
			text-anchor="middle"
			dominant-baseline="central"
		>
			{boardSize - i}
		</text>
		<text
			x={MARGIN_X + i}
			y={MARGIN_TOP + lastIndex + 0.75}
			font-size="0.35"
			class="fill-base-content"
			text-anchor="middle"
			dominant-baseline="central"
		>
			{Horizontal[i]}
		</text>
	{/each}

	{#each { length: boardSize } as _, i}
		<line
			x1={MARGIN_X + i}
			y1={MARGIN_TOP}
			x2={MARGIN_X + i}
			y2={MARGIN_TOP + lastIndex}
			class="stroke-base-content"
			stroke-width="0.03"
		/>
		<line
			x1={MARGIN_X}
			y1={MARGIN_TOP + i}
			x2={MARGIN_X + lastIndex}
			y2={MARGIN_TOP + i}
			class="stroke-base-content"
			stroke-width="0.03"
		/>
	{/each}
	<rect
		x={MARGIN_X}
		y={MARGIN_TOP}
		width={lastIndex}
		height={lastIndex}
		fill="none"
		class="stroke-base-content"
		stroke-width="0.075"
	/>

	{#each starPoints as [sx, sy] (`${sx},${sy}`)}
		<circle
			cx={MARGIN_X + sx}
			cy={MARGIN_TOP + sy}
			r={style.starRadius}
			class="fill-base-content"
		/>
	{/each}

	<!-- Every cell keeps one stone circle (and index label) permanently in the DOM; only its
	     fill/opacity/content change (transparent when empty, translucent for the hover preview). -->
	{#each { length: boardSize } as _, row (row)}
		{#each { length: boardSize } as _, col (col)}
			{@const coordinate = coordinateAt(col, row)}
			{@const color = board.board[coordinate]}
			{@const index = moveIndex[coordinate]}
			{@const isSelected = coordinate === selected}
			<!-- svelte-ignore a11y_click_events_have_key_events -- 225 cells; not keyboard-navigable -->
			<!-- svelte-ignore a11y_no_static_element_interactions -- see above -->
			<g
				onclick={() => interaction.onCellClick(coordinate)}
				onpointerenter={() => interaction.onCellEnter(coordinate)}
			>
				<rect
					x={MARGIN_X + col - 0.5}
					y={MARGIN_TOP + row - 0.5}
					width="1"
					height="1"
					fill="transparent"
				/>
				<circle
					cx={MARGIN_X + col}
					cy={MARGIN_TOP + row}
					r={style.pieceRadius}
					opacity={!color &&
					!isSelected &&
					!disabled &&
					coordinate === interaction.hoverCoordinate
						? style.hoverAlpha
						: 1}
					class={[
						color ? "stroke-base-content" : isSelected && "stroke-primary",
						getCellFillColor(coordinate, color),
					]}
					stroke-opacity={color ? 0.3 : 1}
					stroke-width={isSelected ? style.pieceStrokeWidth * 5 : style.pieceStrokeWidth}
				/>
				{#if index !== undefined && color !== undefined}
					<text
						x={MARGIN_X + col}
						y={MARGIN_TOP + row}
						font-size={style.indexFontSize}
						font-weight="bold"
						text-anchor="middle"
						dominant-baseline="central"
						class={[
							index === board.moves.length - 1
								? "fill-error"
								: pieceTextColors[color],
						]}
					>
						{index + 1}
					</text>
				{/if}
			</g>
		{/each}
	{/each}
</svg>
