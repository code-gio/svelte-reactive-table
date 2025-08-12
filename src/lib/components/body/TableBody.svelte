<!--
  TableBody component - renders table body with rows and cells
-->

<script lang="ts">
	import TableRow from './TableRow.svelte';
	import type { ReactiveTable } from '../../core/ReactiveTable.svelte.js';
	import type { DataRow } from '../../types/core/index.js';

	interface Props<T extends DataRow = DataRow> {
		tableInstance: ReactiveTable<T>;
	}

	let { tableInstance }: Props = $props();

	// Get reactive state and config
	const state = $derived(() => tableInstance?.state || null);
	const config = $derived(() => tableInstance?.config || null);
	const schema = $derived(() => config()?.schema || null);

	// Get editing state and options
	const editingCell = $derived(() => tableInstance?.editingCell || null);
	const editingOptions = $derived(() => tableInstance?.editingOptions || null);

	// Get filtered and sorted data
	const displayData = $derived(() => {
		const currentState = state();
		return currentState?.filteredData || [];
	});

	// Filter visible columns (same logic as header)
	const visibleColumns = $derived(() => {
		const schemaData = schema();
		if (!schemaData || !schemaData.columns) return [];

		return schemaData.columns.filter((column) => {
			if (column.visible === false) return false;

			const stateData = state();
			const visibleSet = stateData?.visibleColumns;
			if (visibleSet && visibleSet.size > 0) {
				return visibleSet.has(String(column.id));
			}

			return true;
		});
	});

	// Sort visible columns by order
	const sortedColumns = $derived(() => {
		return [...visibleColumns()].sort((a, b) => {
			const aOrder = a.order ?? 0;
			const bOrder = b.order ?? 0;
			return aOrder - bOrder;
		});
	});

	// Handle row selection
	function handleRowSelect(rowId: string, selected: boolean) {
		if (selected) {
			tableInstance.selectRows([rowId]);
		} else {
			tableInstance.deselectRows([rowId]);
		}
	}

	// Handle row click/interaction
	function handleRowClick(row: DataRow, event: MouseEvent) {
		const options = config().options;

		// Handle selection if enabled
		if (options?.selectable) {
			const isSelected = state().selectedRows.has(String(row.id));

			if (event.ctrlKey || event.metaKey) {
				// Multi-select with Ctrl/Cmd
				handleRowSelect(String(row.id), !isSelected);
			} else if (event.shiftKey && state().selectedRows.size > 0) {
				// Range selection with Shift
				// TODO: Implement range selection
				handleRowSelect(String(row.id), !isSelected);
			} else {
				// Single selection
				if (options.multiSelect) {
					handleRowSelect(String(row.id), !isSelected);
				} else {
					// Clear other selections for single-select mode
					tableInstance.clearSelection();
					if (!isSelected) {
						handleRowSelect(String(row.id), true);
					}
				}
			}
		}

		// Emit row click event if handler provided
		const onRowClick = options?.onRowClick;
		if (onRowClick) {
			onRowClick(row, event);
		}
	}

	// Handle row double-click
	function handleRowDoubleClick(row: DataRow, event: MouseEvent) {
		const onRowDoubleClick = config()?.options?.onRowDoubleClick;
		if (onRowDoubleClick) {
			onRowDoubleClick(row, event);
		}
	}

	// Check if row is selected
	function isRowSelected(row: DataRow): boolean {
		return state()?.selectedRows.has(String(row.id)) || false;
	}

	// Check if row is expanded (for future expandable rows feature)
	function isRowExpanded(row: DataRow): boolean {
		return state()?.expandedRows.has(String(row.id)) || false;
	}

	// Get row index for accessibility
	function getRowIndex(index: number): number {
		return index + 1; // 1-based for screen readers
	}

	// Calculate column width (same as header)
	function getColumnWidth(column: any) {
		const columnWidths = state()?.columnWidths;
		const customWidth = columnWidths?.get(String(column.id));

		if (customWidth) {
			return `${customWidth}px`;
		}

		if (column.width) {
			return typeof column.width === 'number' ? `${column.width}px` : column.width;
		}

		return 'auto';
	}

	// Check if table is in loading state
	const isLoading = $derived(() => state()?.loading ?? false);

	// Check if table has error
	const hasError = $derived(() => !!state()?.error);

	// Empty state message
	const emptyMessage = $derived(() => {
		const options = config()?.options;
		return options?.emptyMessage || 'No data available';
	});

	// Cell editing handlers
	function handleStartEdit(rowId: string, columnId: string) {
		tableInstance?.startCellEdit(rowId, columnId);
	}

	async function handleSaveEdit(rowId: string, columnId: string, newValue: any) {
		await tableInstance?.saveCellEdit(rowId, columnId, newValue);
	}

	function handleCancelEdit(_rowId: string, _columnId: string) {
		tableInstance?.cancelCellEdit();
	}

	function handleEditError(_rowId: string, _columnId: string, error: Error) {
		console.error('Cell edit error:', error);
		// Error is already handled by the tableInstance method
	}
</script>

<!-- Table body -->
{#if schema() && sortedColumns().length > 0}
	<tbody class="table-body" class:loading={isLoading()} class:error={hasError()}>
		{#if hasError()}
			<!-- Error state -->
			<tr class="error-row">
				<td
					class="error-cell"
					colspan={sortedColumns().length + (config()?.options?.selectable ? 1 : 0)}
					role="cell"
					aria-live="polite"
				>
					<div class="error-content">
						<svg
							class="error-icon"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
							/>
						</svg>
						<div class="error-text">
							<strong>Error loading data</strong>
							<p>{state()?.error}</p>
						</div>
					</div>
				</td>
			</tr>
		{:else if displayData().length === 0 && !isLoading()}
			<!-- Empty state -->
			<tr class="empty-row">
				<td
					class="empty-cell"
					colspan={sortedColumns().length + (config()?.options?.selectable ? 1 : 0)}
					role="cell"
				>
					<div class="empty-content">
						<svg
							class="empty-icon"
							width="48"
							height="48"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1"
							aria-hidden="true"
						>
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
							<line x1="9" y1="9" x2="15" y2="15" />
							<line x1="15" y1="9" x2="9" y2="15" />
						</svg>
						<p class="empty-message">{emptyMessage()}</p>
					</div>
				</td>
			</tr>
		{:else}
			<!-- Data rows -->
			{#each displayData() as row, index (row.id)}
				<TableRow
					{row}
					{index}
					columns={sortedColumns()}
					selected={isRowSelected(row)}
					expanded={isRowExpanded(row)}
					rowIndex={getRowIndex(index)}
					selectable={config()?.options?.selectable || false}
					{getColumnWidth}
					onClick={(event) => handleRowClick(row, event)}
					onDoubleClick={(event) => handleRowDoubleClick(row, event)}
					onSelect={(selected) => handleRowSelect(String(row.id), selected)}
					editing={editingOptions() || undefined}
					editingCell={editingCell() || undefined}
					onStartEdit={handleStartEdit}
					onSaveEdit={handleSaveEdit}
					onCancelEdit={handleCancelEdit}
					onEditError={handleEditError}
				/>
			{/each}
		{/if}

		{#if isLoading()}
			<!-- Loading skeleton rows -->
			{#each Array(5) as _, index}
				<tr class="loading-row" class:loading={true}>
					<!-- Selection skeleton cell (if selectable) -->
					{#if config()?.options?.selectable}
						<td class="loading-cell selection-cell">
							<div class="loading-skeleton"></div>
						</td>
					{/if}

					{#each sortedColumns() as column}
						<td class="loading-cell" style="width: {getColumnWidth(column)}">
							<div class="loading-skeleton"></div>
						</td>
					{/each}
				</tr>
			{/each}
		{/if}
	</tbody>
{:else}
	<!-- Loading state when schema is not available -->
	<tbody class="table-body loading">
		<tr class="loading-row">
			<td class="loading-cell" colspan="1">
				<div class="loading-skeleton"></div>
			</td>
		</tr>
	</tbody>
{/if}

<style>
	.table-body {
		background: var(--table-body-bg, #ffffff);
	}

	/* Error state */
	.error-row {
		background: var(--table-error-bg, #fef2f2);
	}

	.error-cell {
		padding: 2rem 1rem;
		text-align: center;
		border: none;
	}

	.error-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		color: var(--table-error-text, #dc2626);
	}

	.error-icon {
		width: 3rem;
		height: 3rem;
		opacity: 0.6;
	}

	.error-text strong {
		display: block;
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
	}

	.error-text p {
		margin: 0;
		font-size: 0.9rem;
		opacity: 0.8;
	}

	/* Empty state */
	.empty-row {
		background: transparent;
	}

	.empty-cell {
		padding: 3rem 1rem;
		text-align: center;
		border: none;
	}

	.empty-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		color: var(--table-text-muted, #9ca3af);
	}

	.empty-icon {
		width: 3rem;
		height: 3rem;
		opacity: 0.4;
	}

	.empty-message {
		margin: 0;
		font-size: 1rem;
		font-weight: 500;
	}

	/* Loading skeleton */
	.skeleton-row {
		background: transparent;
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.skeleton-cell {
		padding: 0.75rem 1rem;
		border-right: 1px solid var(--table-border, #e2e8f0);
	}

	.skeleton-cell:last-child {
		border-right: none;
	}

	.skeleton-content {
		height: 1rem;
		background: var(--table-skeleton, #e2e8f0);
		border-radius: 0.25rem;
		width: 80%;
	}

	/* Pulse animation for skeleton */
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	/* Loading state */
	.table-body.loading {
		position: relative;
	}

	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.table-body {
			background: var(--table-body-bg, #1f2937);
		}

		.error-row {
			background: var(--table-error-bg, #7f1d1d);
		}

		.error-content {
			color: var(--table-error-text, #f87171);
		}

		.empty-content {
			color: var(--table-text-muted, #6b7280);
		}

		.skeleton-content {
			background: var(--table-skeleton, #374151);
		}

		.skeleton-cell {
			border-right-color: var(--table-border, #4a5568);
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.error-content {
			color: #dc2626;
		}

		.empty-content {
			color: #374151;
		}

		.skeleton-content {
			background: #6b7280;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.skeleton-row {
			animation: none;
		}

		.skeleton-content {
			opacity: 0.6;
		}
	}

	/* Print styles */
	@media print {
		.table-body {
			background: white !important;
		}

		.skeleton-row,
		.empty-row,
		.error-row {
			display: none;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.error-cell,
		.empty-cell {
			padding: 1.5rem 0.75rem;
		}

		.error-icon,
		.empty-icon {
			width: 2rem;
			height: 2rem;
		}

		.error-text strong,
		.empty-message {
			font-size: 0.9rem;
		}

		.skeleton-cell {
			padding: 0.5rem 0.75rem;
		}
	}
</style>
