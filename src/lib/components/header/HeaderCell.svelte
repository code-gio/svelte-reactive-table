<!--
  HeaderCell component - individual header cell with sorting and resizing
-->

<script lang="ts">
	import SortControls from './SortControls.svelte';
	import ColumnResizer from './ColumnResizer.svelte';
	import type { ColumnDefinition, TableSort } from '../../types/core/index.js';

	interface Props {
		column: ColumnDefinition;
		index: number;
		sort?: TableSort;
		sortable: boolean;
		resizable: boolean;
		width: string;
		onSort: (direction: 'asc' | 'desc' | null) => void;
		onResize: (width: number) => void;
	}

	let {
		column,
		index,
		sort,
		sortable = false,
		resizable = false,
		width = 'auto',
		onSort,
		onResize
	}: Props = $props();

	// Handle sort click
	function handleSortClick() {
		if (!sortable) return;

		let nextDirection: 'asc' | 'desc' | null = 'asc';

		if (sort?.direction === 'asc') {
			nextDirection = 'desc';
		} else if (sort?.direction === 'desc') {
			nextDirection = null; // Clear sort
		}

		onSort(nextDirection);
	}

	// Handle keyboard navigation for sorting
	function handleKeyDown(event: KeyboardEvent) {
		if (!sortable) return;

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleSortClick();
		}
	}

	// Get alignment class
	const alignmentClass = $derived(() => {
		switch (column.align) {
			case 'center':
				return 'text-center';
			case 'right':
				return 'text-right';
			default:
				return 'text-left';
		}
	});

	// Get column description for accessibility
	const columnDescription = $derived(() => {
		let desc = column.description || '';

		if (sortable) {
			if (sort?.direction) {
				desc += ` (sorted ${sort.direction}ending)`;
			} else {
				desc += ' (sortable)';
			}
		}

		if (column.required) {
			desc += ' (required)';
		}

		return desc.trim();
	});

	// Generate unique id for header
	const headerId = `header-${String(column.id)}-${index}`;
</script>

<!-- Header cell -->
<th
	id={headerId}
	class="header-cell {alignmentClass()}"
	class:sortable
	class:sorted={!!sort}
	class:resizable
	style="width: {width}; min-width: {column.minWidth || 'auto'}; max-width: {column.maxWidth ||
		'none'}"
	role="columnheader"
	aria-sort={sort?.direction === 'asc'
		? 'ascending'
		: sort?.direction === 'desc'
			? 'descending'
			: 'none'}
	aria-describedby={columnDescription() ? `${headerId}-desc` : undefined}
	tabindex={sortable ? 0 : -1}
	onclick={handleSortClick}
	onkeydown={handleKeyDown}
>
	<!-- Column content wrapper -->
	<div class="header-content">
		<!-- Column header text -->
		<div class="header-text">
			<span class="header-title">
				{column.header}
			</span>

			<!-- Required indicator -->
			{#if column.required}
				<span class="required-indicator" aria-label="required">*</span>
			{/if}

			<!-- Column type indicator (for screen readers) -->
			<span class="sr-only">
				{column.type} column
			</span>
		</div>

		<!-- Sort controls -->
		{#if sortable}
			<SortControls direction={sort?.direction} priority={sort?.priority} />
		{/if}
	</div>

	<!-- Column resizer -->
	{#if resizable}
		<ColumnResizer
			{onResize}
			minWidth={typeof column.minWidth === 'number' ? column.minWidth : 50}
			maxWidth={typeof column.maxWidth === 'number' ? column.maxWidth : 500}
		/>
	{/if}

	<!-- Hidden description for screen readers -->
	{#if columnDescription()}
		<div id="{headerId}-desc" class="sr-only">
			{columnDescription()}
		</div>
	{/if}
</th>

<style>
	.header-cell {
		position: relative;
		padding: 0.75rem 1rem;
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--table-text, #374151);
		background: var(--table-header-bg, #f7fafc);
		border-right: 1px solid var(--table-border, #e2e8f0);
		user-select: none;
		vertical-align: middle;
	}

	.header-cell:last-child {
		border-right: none;
	}

	/* Sortable cells */
	.header-cell.sortable {
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.header-cell.sortable:hover {
		background: var(--table-row-hover, #f1f5f9);
	}

	.header-cell.sortable:focus {
		outline: 2px solid var(--table-focus, #3b82f6);
		outline-offset: -2px;
		background: var(--table-row-hover, #f1f5f9);
	}

	/* Sorted cells */
	.header-cell.sorted {
		background: var(--table-selected, #ebf8ff);
		color: var(--table-text-selected, #1e40af);
	}

	/* Resizable cells */
	.header-cell.resizable {
		position: relative;
	}

	/* Header content layout */
	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		min-height: 1.5rem;
	}

	.header-text {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex: 1;
		min-width: 0; /* Allow text to truncate */
	}

	.header-title {
		font-weight: inherit;
		color: inherit;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Required indicator */
	.required-indicator {
		color: #dc2626;
		font-weight: bold;
		font-size: 1rem;
	}

	/* Text alignment classes */
	.text-left .header-content {
		justify-content: flex-start;
	}

	.text-center .header-content {
		justify-content: center;
	}

	.text-right .header-content {
		justify-content: flex-end;
	}

	/* Screen reader only content */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.header-cell {
			color: var(--table-text, #f3f4f6);
			background: var(--table-header-bg, #2d3748);
			border-right-color: var(--table-border, #4a5568);
		}

		.header-cell.sortable:hover,
		.header-cell.sortable:focus {
			background: var(--table-row-hover, #374151);
		}

		.header-cell.sorted {
			background: var(--table-selected, #1e3a8a);
			color: var(--table-text-selected, #bfdbfe);
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.header-cell {
			border-right: 2px solid;
		}

		.header-cell.sortable:focus {
			outline: 3px solid;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.header-cell.sortable {
			transition: none;
		}
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.header-cell {
			padding: 0.5rem 0.75rem;
			font-size: 0.8125rem;
		}

		.header-content {
			gap: 0.25rem;
		}

		.header-text {
			gap: 0.125rem;
		}
	}

	/* Print styles */
	@media print {
		.header-cell {
			background: white !important;
			color: black !important;
			border-right: 1px solid black;
		}

		.header-cell.sortable {
			cursor: default;
		}
	}
</style>
