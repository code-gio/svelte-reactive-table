<!--
  TableRow component - renders individual table row with cells
  Supports inline cell editing when enabled
-->

<script lang="ts">
	import TableCell from './TableCell.svelte';
	import type { DataRow, ColumnDefinition, EditingOptions } from '../../types/core/index.js';

	interface Props {
		row: DataRow;
		index: number;
		columns: ColumnDefinition[];
		selected: boolean;
		expanded: boolean;
		rowIndex: number; // 1-based index for screen readers
		selectable: boolean;
		getColumnWidth: (column: ColumnDefinition) => string;
		onClick: (event: MouseEvent) => void;
		onDoubleClick: (event: MouseEvent) => void;
		onSelect: (selected: boolean) => void;
		/** Optional editing configuration */
		editing?: EditingOptions;
		/** Currently editing cell (rowId:columnId) */
		editingCell?: string;
		/** Cell edit handlers */
		onStartEdit?: (rowId: string, columnId: string) => void;
		onSaveEdit?: (rowId: string, columnId: string, newValue: any) => void | Promise<void>;
		onCancelEdit?: (rowId: string, columnId: string) => void;
		onEditError?: (rowId: string, columnId: string, error: Error) => void;
	}

	let {
		row,
		index,
		columns,
		selected = false,
		expanded = false,
		rowIndex,
		selectable = false,
		getColumnWidth,
		onClick,
		onDoubleClick,
		onSelect,
		editing,
		editingCell,
		onStartEdit,
		onSaveEdit,
		onCancelEdit,
		onEditError
	}: Props = $props();

	// Handle row click
	function handleClick(event: MouseEvent) {
		onClick(event);
	}

	// Handle row double-click
	function handleDoubleClick(event: MouseEvent) {
		onDoubleClick(event);
	}

	// Handle checkbox change for row selection
	function handleSelectionChange(event: Event) {
		const checkbox = event.target as HTMLInputElement;
		onSelect(checkbox.checked);
	}

	// Handle keyboard navigation
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			if (selectable) {
				event.preventDefault();
				onSelect(!selected);
			}
		}
	}

	// Generate unique ID for the row
	const rowId = `row-${row.id}-${index}`;

	// Check if row is even/odd for striping
	const isEven = index % 2 === 0;

	// Get row status classes
	const statusClasses = $derived(() => {
		const classes: string[] = [];
		
		if (selected) classes.push('selected');
		if (expanded) classes.push('expanded');
		if (isEven) classes.push('even');
		else classes.push('odd');
		if (selectable) classes.push('selectable');
		
		return classes.join(' ');
	});
</script>

<!-- Table row -->
<tr
	id={rowId}
	class="table-row {statusClasses()}"
	aria-rowindex={rowIndex}
	aria-selected={selectable ? selected : undefined}
	tabindex={selectable ? 0 : -1}
	onclick={handleClick}
	ondblclick={handleDoubleClick}
	onkeydown={handleKeyDown}
>
	<!-- Selection column (if selectable) -->
	{#if selectable}
		<td class="selection-cell" role="cell" onclick={(e) => e.stopPropagation()}>
			<label class="selection-label">
				<input
					type="checkbox"
					class="selection-checkbox"
					checked={selected}
					onchange={handleSelectionChange}
					aria-label="Select row {rowIndex}"
				/>
				<span class="checkbox-indicator" aria-hidden="true"></span>
				<span class="sr-only">Select row {rowIndex}</span>
			</label>
		</td>
	{/if}

	<!-- Data cells -->
	{#each columns as column (column.id)}
		{@const rowId = String(row.id)}
		{@const columnId = String(column.id)}
		{@const cellKey = `${rowId}:${columnId}`}
		<TableCell
			{row}
			{column}
			width={getColumnWidth(column)}
			value={row[String(column.id)]}
			{rowId}
			{columnId}
			{editing}
			isEditing={editingCell === cellKey}
			{onStartEdit}
			{onSaveEdit}
			{onCancelEdit}
			{onEditError}
		/>
	{/each}

	<!-- Expansion column (placeholder for future expandable rows) -->
	{#if expanded}
		<!-- This would contain expanded content in the future -->
	{/if}
</tr>

<style>
	.table-row {
		background: var(--table-row-bg, transparent);
		border-bottom: 1px solid var(--table-border, #e2e8f0);
		transition: background-color 0.2s ease;
	}

	/* Row states */
	.table-row.selectable {
		cursor: pointer;
	}

	.table-row.selectable:hover {
		background: var(--table-row-hover, #f8fafc);
	}

	.table-row.selectable:focus {
		outline: 2px solid var(--table-focus, #3b82f6);
		outline-offset: -2px;
		background: var(--table-row-hover, #f8fafc);
	}

	.table-row.selected {
		background: var(--table-row-selected, #eff6ff);
		color: var(--table-text-selected, #1e40af);
	}

	.table-row.selected:hover {
		background: var(--table-row-selected-hover, #dbeafe);
	}

	/* Striped rows */
	.table-row.even {
		background: var(--table-row-even, transparent);
	}

	.table-row.odd {
		background: var(--table-row-odd, rgba(0, 0, 0, 0.02));
	}

	/* Selection cell */
	.selection-cell {
		width: 48px;
		min-width: 48px;
		max-width: 48px;
		padding: 0.75rem 1rem;
		vertical-align: middle;
		text-align: center;
		background: inherit;
		border-right: 1px solid var(--table-border, #e2e8f0);
	}

	.selection-label {
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		position: relative;
	}

	.selection-checkbox {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.checkbox-indicator {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: 2px solid var(--table-checkbox-border, #d1d5db);
		border-radius: 0.25rem;
		background: var(--table-checkbox-bg, #ffffff);
		transition: all 0.2s ease;
		position: relative;
	}

	.selection-checkbox:checked + .checkbox-indicator {
		background: var(--table-checkbox-checked, #3b82f6);
		border-color: var(--table-checkbox-checked, #3b82f6);
		color: white;
	}

	.selection-checkbox:checked + .checkbox-indicator::after {
		content: '✓';
		font-size: 12px;
		font-weight: bold;
		line-height: 1;
	}

	.selection-checkbox:focus + .checkbox-indicator {
		outline: 2px solid var(--table-focus, #3b82f6);
		outline-offset: 2px;
	}

	.selection-label:hover .checkbox-indicator {
		border-color: var(--table-checkbox-hover, #9ca3af);
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
		.table-row {
			border-bottom-color: var(--table-border, #4a5568);
		}

		.table-row.selectable:hover,
		.table-row.selectable:focus {
			background: var(--table-row-hover, #374151);
		}

		.table-row.selected {
			background: var(--table-row-selected, #1e3a8a);
			color: var(--table-text-selected, #bfdbfe);
		}

		.table-row.selected:hover {
			background: var(--table-row-selected-hover, #1e40af);
		}

		.table-row.odd {
			background: var(--table-row-odd, rgba(255, 255, 255, 0.02));
		}

		.selection-cell {
			border-right-color: var(--table-border, #4a5568);
		}

		.checkbox-indicator {
			border-color: var(--table-checkbox-border, #6b7280);
			background: var(--table-checkbox-bg, #374151);
		}

		.selection-checkbox:checked + .checkbox-indicator {
			background: var(--table-checkbox-checked, #3b82f6);
			border-color: var(--table-checkbox-checked, #3b82f6);
		}

		.selection-label:hover .checkbox-indicator {
			border-color: var(--table-checkbox-hover, #9ca3af);
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.table-row {
			border-bottom: 2px solid;
		}

		.table-row.selectable:focus {
			outline: 3px solid;
		}

		.checkbox-indicator {
			border-width: 2px;
		}

		.selection-checkbox:focus + .checkbox-indicator {
			outline: 3px solid;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.table-row,
		.checkbox-indicator {
			transition: none;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.selection-cell {
			width: 40px;
			min-width: 40px;
			max-width: 40px;
			padding: 0.5rem 0.75rem;
		}

		.checkbox-indicator {
			width: 16px;
			height: 16px;
		}

		.selection-checkbox:checked + .checkbox-indicator::after {
			font-size: 10px;
		}
	}

	/* Print styles */
	@media print {
		.table-row {
			background: white !important;
			color: black !important;
			border-bottom: 1px solid black;
		}

		.selection-cell {
			display: none;
		}

		.table-row.selectable {
			cursor: default;
		}
	}
</style>