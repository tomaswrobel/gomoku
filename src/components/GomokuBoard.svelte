<script lang="ts">
	import type { Board } from "../Board.svelte.ts";
	import { Color } from "../Color";
	import { tw } from "@juvofy/lib/utils/tw";
	import type { ClassValue } from "svelte/elements";
	import type { Coordinate } from "../coordinate/Coordinate.js";
	import { boardSize } from "../boardSize.js";
	import { Horizontal } from "../coordinate/Horizontal.js";

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

	// Layout constants, in SVG user units (1 unit = 1 cell), so the whole board scales via viewBox.
	const marginX = 1.4;
	const marginTop = 0.7;
	const marginBottom = 1.2;
	const viewBoxWidth = lastIndex + marginX * 2;
	const viewBoxHeight = lastIndex + marginTop + marginBottom;

	// Below this, cells get too small to comfortably tap/read (especially on mobile), so the board
	// stops shrinking and its scroll container (see App.svelte) takes over instead of the cells.
	const MIN_CELL_SIZE_PX = 32;
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

	let hoverCoordinate = $state<Coordinate>();

	const nextColor = $derived(board.moves.length % 2 ? Color.White : Color.Black);
	const moveIndex = $derived.by(() => {
		const map: Partial<Record<Coordinate, number>> = {};
		board.moves.forEach((coordinate, i) => (map[coordinate] = i));
		return map;
	});

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

	function coordinateAt(col: number, row: number): Coordinate {
		return `${Horizontal[col]}${boardSize - row}` as Coordinate;
	}

	function getCellFillColor(coordinate: Coordinate, color: Color | undefined): ClassValue {
		if (color) {
			return pieceFillColors[color];
		}
		if (coordinate === selected) {
			return pieceFillColors[nextColor];
		}
		if (!disabled && coordinate === hoverCoordinate) {
			return pieceFillColors[nextColor];
		}
		return tw("fill-transparent");
	}

	function onCellClick(coordinate: Coordinate) {
		if (disabled || board.board[coordinate]) {
			return;
		}
		hoverCoordinate = undefined;
		onPlay(coordinate);
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
	onpointerleave={() => {
		hoverCoordinate = undefined;
	}}
	oncontextmenu={(event) => event.preventDefault()}
>
	<!-- Covers the full viewBox (not just the grid) so the coordinate labels sit on the board
	     background instead of being clipped against the page background outside it. -->
	<rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} rx="0.3" class="fill-base-200" />

	{#each { length: boardSize } as _, i}
		<text
			x={marginX - 0.75}
			y={marginTop + i}
			font-size="0.35"
			class="fill-base-content"
			text-anchor="middle"
			dominant-baseline="central"
		>
			{boardSize - i}
		</text>
		<text
			x={marginX + lastIndex + 0.75}
			y={marginTop + i}
			font-size="0.35"
			class="fill-base-content"
			text-anchor="middle"
			dominant-baseline="central"
		>
			{boardSize - i}
		</text>
		<text
			x={marginX + i}
			y={marginTop + lastIndex + 0.75}
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
			x1={marginX + i}
			y1={marginTop}
			x2={marginX + i}
			y2={marginTop + lastIndex}
			class="stroke-base-content"
			stroke-width="0.03"
		/>
		<line
			x1={marginX}
			y1={marginTop + i}
			x2={marginX + lastIndex}
			y2={marginTop + i}
			class="stroke-base-content"
			stroke-width="0.03"
		/>
	{/each}
	<rect
		x={marginX}
		y={marginTop}
		width={lastIndex}
		height={lastIndex}
		fill="none"
		class="stroke-base-content"
		stroke-width="0.075"
	/>

	{#each starPoints as [sx, sy] (`${sx},${sy}`)}
		<circle
			cx={marginX + sx}
			cy={marginTop + sy}
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
				onclick={() => onCellClick(coordinate)}
				onpointerenter={() => {
					if (!disabled && board.board[coordinate] === undefined) {
						hoverCoordinate = coordinate;
					}
				}}
			>
				<rect
					x={marginX + col - 0.5}
					y={marginTop + row - 0.5}
					width="1"
					height="1"
					fill="transparent"
				/>
				<circle
					cx={marginX + col}
					cy={marginTop + row}
					r={style.pieceRadius}
					opacity={!color && !isSelected && !disabled && coordinate === hoverCoordinate
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
						x={marginX + col}
						y={marginTop + row}
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
