<!--
  TableHeader component - renders table header with column headers and controls
-->

<script lang="ts">
	import HeaderCell from './HeaderCell.svelte';
	import type { ReactiveTable } from '../../core/ReactiveTable.svelte.js';
	import type { DataRow } from '../../types/core/index.js';

	interface Props<T extends DataRow = DataRow> {
		tableInstance: ReactiveTable<T>;
	}

	let { tableInstance }: Props = $props();

	// Get reactive state and config
	const state = $derived(() => {
		if (!tableInstance) {
			return null;
		}
		return tableInstance.state || null;
	});

	const config = $derived(() => {
		if (!tableInstance) {
			return null;
		}
		return tableInstance.config || null;
	});

	const schema = $derived(() => {
		const configData = config();
		if (!configData) {
			return null;
		}
		const schemaData = configData?.schema;
		return schemaData || null;
	});

	// Filter visible columns
	const visibleColumns = $derived(() => {
		const schemaData = schema();
		if (!schemaData || !schemaData.columns) {
			return [];
		}

		const filtered = schemaData.columns.filter((column) => {
			// Check if column is visible (default to true if not specified)
			if (column.visible === false) return false;

			// Check if column is in visible columns set (if specified)
			const stateData = state();
			const visibleSet = stateData?.visibleColumns;
			if (visibleSet && visibleSet.size > 0) {
				return visibleSet.has(String(column.id));
			}

			return true;
		});

		return filtered;
	});

	// Sort visible columns by order
	const sortedColumns = $derived(() => {
		const columns = [...visibleColumns()];
		const sorted = columns.sort((a, b) => {
			const aOrder = a.order ?? 0;
			const bOrder = b.order ?? 0;
			return aOrder - bOrder;
		});
		return sorted;
	});

	// Handle column resize
	function handleColumnResize(columnId: string, width: number) {
		// This would call a public API method on tableInstance
		// For now, we'll track it locally
		console.log('Column resize:', columnId, width);
	}

	// Handle sort change
	function handleSort(columnId: string, direction: 'asc' | 'desc' | null) {
		if (direction === null) {
			tableInstance.clearSort();
		} else {
			tableInstance.setSort({
				column: columnId,
				direction
			});
		}
	}

	// Get current sort for a column
	function getColumnSort(columnId: string) {
		const sorts = state()?.sorts;
		return sorts?.find((sort) => sort.column === columnId);
	}

	// Check if sorting is enabled for a column
	function isSortable(column: any) {
		// Check global sortable option
		if (config()?.options?.sortable === false) return false;

		// Check column-specific sortable option
		if (column.sortable === false) return false;

		// Default to true if not specified
		return column.sortable !== false;
	}

	// Check if resizing is enabled for a column
	function isResizable(column: any) {
		// Check global resizable option
		if (config()?.options?.resizable === false) return false;

		// Check column-specific resizable option
		if (column.resizable === false) return false;

		// Default to true if not specified
		return column.resizable !== false;
	}

	// Calculate column width
	function getColumnWidth(column: any) {
		const columnWidths = state()?.columnWidths;
		const customWidth = columnWidths?.get(String(column.id));

		if (customWidth) {
			return `${customWidth}px`;
		}

		if (column.width) {
			return typeof column.width === 'number' ? `${column.width}px` : column.width;
		}

		// Default width
		return 'auto';
	}
</script>

<!-- Table header -->
{#if schema() && sortedColumns().length > 0}
	<thead class="table-header">
		<tr class="header-row">
			<!-- Selection header (if selectable) -->
			{#if config()?.options?.selectable}
				<th class="selection-header" role="columnheader" aria-label="Select all rows">
					<label class="selection-label">
						<input
							type="checkbox"
							class="selection-checkbox"
							onchange={(e) => {
								const checkbox = e.target as HTMLInputElement;
								if (checkbox.checked) {
									tableInstance?.selectAllRows();
								} else {
									tableInstance?.clearSelection();
								}
							}}
							aria-label="Select all rows"
						/>
						<span class="checkbox-indicator" aria-hidden="true"></span>
					</label>
				</th>
			{/if}

			{#each sortedColumns() as column, index (column.id)}
				<HeaderCell
					{column}
					{index}
					sort={getColumnSort(String(column.id))}
					sortable={isSortable(column)}
					resizable={isResizable(column)}
					width={getColumnWidth(column)}
					onSort={(direction) => handleSort(String(column.id), direction)}
					onResize={(width) => handleColumnResize(String(column.id), width)}
				/>
			{/each}
		</tr>
	</thead>
{/if}

<style>
	.table-header {
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--table-header-bg, #f7fafc);
		border-bottom: 2px solid var(--table-border, #e2e8f0);
	}

	.header-row {
		border: none;
	}

	/* Ensure header stays above content when scrolling */
	@supports (position: sticky) {
		.table-header {
			position: sticky;
		}
	}

	/* Fallback for older browsers */
	@supports not (position: sticky) {
		.table-header {
			position: relative;
		}
	}

	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.table-header {
			background: var(--table-header-bg, #2d3748);
			border-bottom-color: var(--table-border, #4a5568);
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.table-header {
			border-bottom: 3px solid;
		}
	}

	/* Print styles */
	@media print {
		.table-header {
			position: static;
			break-inside: avoid;
		}
	}

	/* Debug styles */
	.debug-cell {
		background: #ffeb3b;
		color: #000;
		font-size: 12px;
		padding: 8px;
		text-align: center;
	}

	/* Selection header */
	.selection-header {
		width: 48px;
		min-width: 48px;
		max-width: 48px;
		padding: 0.75rem 1rem;
		text-align: center;
		background: var(--table-header-bg, #f7fafc);
		border-right: 1px solid var(--table-border, #e2e8f0);
	}

	.selection-label {
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.selection-checkbox {
		width: 16px;
		height: 16px;
		cursor: pointer;
	}

	.checkbox-indicator {
		display: none;
	}
</style>
