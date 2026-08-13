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
	// Unlike GomokuBoard, pieces live inside cells, not on grid intersections, so the grid spans
	// boardSize cells (not boardSize - 1 gaps) and coordinate labels sit outside that extra cell.
	const marginX = 1.4;
	const marginTop = 0.7;
	const marginBottom = 1.2;
	const viewBoxWidth = boardSize + marginX * 2;
	const viewBoxHeight = boardSize + marginTop + marginBottom;

	// Below this, cells get too small to comfortably tap/read (especially on mobile), so the board
	// stops shrinking and its scroll container (see App.svelte) takes over instead of the cells.
	const MIN_CELL_SIZE_PX = 32;
	const minWidth = viewBoxWidth * MIN_CELL_SIZE_PX;
	const minHeight = viewBoxHeight * MIN_CELL_SIZE_PX;

	const style = {
		markStrokeWidth: 0.09,
		markRadius: 0.32,
		markPad: 0.22,
		indexFontSize: 0.32,
		hoverAlpha: 0.4,
	};

	const markColors: Record<Color, ClassValue> = {
		[Color.Black]: tw("stroke-primary"),
		[Color.White]: tw("stroke-secondary"),
	};

	let hoverCoordinate = $state<Coordinate>();

	const nextColor = $derived(board.moves.length % 2 ? Color.White : Color.Black);
	const moveIndex = $derived.by(() => {
		const map: Partial<Record<Coordinate, number>> = {};
		board.moves.forEach((coordinate, i) => (map[coordinate] = i));
		return map;
	});

	function coordinateAt(col: number, row: number): Coordinate {
		return `${Horizontal[col]}${boardSize - row}` as Coordinate;
	}

	function isPreview(coordinate: Coordinate): boolean {
		if (disabled) return false;
		if (board.board[coordinate]) return false;
		return coordinate === selected || coordinate === hoverCoordinate;
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
			y={marginTop + i + 0.5}
			font-size="0.35"
			class="fill-base-content"
			text-anchor="middle"
			dominant-baseline="central"
		>
			{boardSize - i}
		</text>
		<text
			x={marginX + boardSize + 0.75}
			y={marginTop + i + 0.5}
			font-size="0.35"
			class="fill-base-content"
			text-anchor="middle"
			dominant-baseline="central"
		>
			{boardSize - i}
		</text>
		<text
			x={marginX + i + 0.5}
			y={marginTop + boardSize + 0.75}
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
			x1={marginX + i}
			y1={marginTop}
			x2={marginX + i}
			y2={marginTop + boardSize}
			class="stroke-base-content"
			stroke-width="0.03"
		/>
		<line
			x1={marginX}
			y1={marginTop + i}
			x2={marginX + boardSize}
			y2={marginTop + i}
			class="stroke-base-content"
			stroke-width="0.03"
		/>
	{/each}
	<rect
		x={marginX}
		y={marginTop}
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
			{@const index = moveIndex[coordinate]}
			{@const cx = marginX + col + 0.5}
			{@const cy = marginTop + row + 0.5}
			{@const preview = isPreview(coordinate)}
			{@const markColor = color ?? (preview ? nextColor : undefined)}
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
					x={marginX + col}
					y={marginTop + row}
					width="1"
					height="1"
					fill="transparent"
				/>

				{#if coordinate === selected}
					<rect
						x={marginX + col + 0.04}
						y={marginTop + row + 0.04}
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
