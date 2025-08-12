<!--
  TableContainer component - handles the main table structure with scroll and virtualization
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import TableHeader from '../header/TableHeader.svelte';
	import TableBody from '../body/TableBody.svelte';
	import type { ReactiveTable } from '../../core/ReactiveTable.svelte.js';
	import type { DataRow } from '../../types/core/index.js';

	interface Props<T extends DataRow = DataRow> {
		tableInstance: ReactiveTable<T>;
	}

	let { tableInstance }: Props = $props();

	// Get reactive state from table instance
	const tableState = $derived(() => tableInstance.state);
	const config = $derived(() => tableInstance.config);

	// Virtual scrolling state
	let containerElement: HTMLDivElement;
	let scrollTop = $state(0);
	let containerHeight = $state(0);

	// Update virtual scroll state when scrolling
	function handleScroll(event: Event) {
		const target = event.target as HTMLElement;
		scrollTop = target.scrollTop;

		// Virtual scrolling will be handled through public API
		// For now, we'll track scroll position locally
		// TODO: Add public API method to update virtual scroll state
	}

	// Update container height on resize
	function updateContainerHeight() {
		if (containerElement) {
			containerHeight = containerElement.clientHeight;

			// Virtual scrolling container height will be handled through public API
			// TODO: Add public API method to update container height
		}
	}

	// Set up resize observer for container (using onMount instead of $effect)
	let resizeObserver: ResizeObserver;

	onMount(() => {
		if (containerElement) {
			updateContainerHeight();

			resizeObserver = new ResizeObserver(() => {
				updateContainerHeight();
			});

			resizeObserver.observe(containerElement);
		}
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
	});

	// Loading and error states
	const isLoading = $derived(() => tableState().loading);
	const hasError = $derived(() => !!tableState().error);
	const hasData = $derived(() => tableState().paginatedData.length > 0);
	const isVirtual = $derived(() => config().options?.virtual || false);

	// Table stats for debugging
	const stats = $derived(() => tableInstance.getStats());
</script>

<!-- Main table container -->
<div
	bind:this={containerElement}
	class="table-container"
	class:virtual={isVirtual()}
	class:loading={isLoading()}
	onscroll={handleScroll}
	role="table"
	aria-rowcount={stats()?.totalRows}
	aria-colcount={config().schema.columns.length}
	aria-label="Data table content"
>
	<!-- Table element -->
	<table class="table">
		<!-- Table header -->
		<TableHeader {tableInstance} />

		<!-- Table body -->
		{#if hasError()}
			<tbody>
				<tr>
					<td colspan={config().schema.columns.length} class="error-cell">
						<div class="inline-error">
							Error loading data: {tableState().error}
							<button type="button" class="retry-btn" onclick={() => tableInstance.refresh()}>
								Retry
							</button>
						</div>
					</td>
				</tr>
			</tbody>
		{:else if isLoading() && !hasData()}
			<tbody>
				<tr>
					<td colspan={config().schema.columns.length} class="loading-cell">
						<div class="inline-loading">
							<div class="spinner" aria-hidden="true"></div>
							Loading data...
						</div>
					</td>
				</tr>
			</tbody>
		{:else if !hasData()}
			<tbody>
				<tr>
					<td colspan={config().schema.columns.length} class="empty-cell">
						<div class="empty-state">
							<div class="empty-icon" aria-hidden="true">📄</div>
							<h3>No data available</h3>
							<p>There are no records to display.</p>
						</div>
					</td>
				</tr>
			</tbody>
		{:else}
			<TableBody {tableInstance} />
		{/if}
	</table>

	<!-- Virtual scroll spacers for performance -->
	{#if isVirtual() && hasData()}
		<div
			class="virtual-spacer-top"
			style="height: {tableState().renderRange.offsetTop}px"
			aria-hidden="true"
		></div>
		<div
			class="virtual-spacer-bottom"
			style="height: {tableState().renderRange.offsetBottom}px"
			aria-hidden="true"
		></div>
	{/if}
</div>

<!-- Table info for screen readers -->
<div class="table-info sr-only" aria-live="polite">
	{#if isLoading()}
		Loading table data
	{:else if hasError()}
		Error loading table data
	{:else}
		Table loaded with {stats()?.totalRows || 0} rows
	{/if}
</div>

<style>
	.table-container {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 200px;
		max-height: 600px;
		overflow: auto;
		background: var(--table-bg, #ffffff);
		border-radius: inherit;
	}

	.table-container.virtual {
		/* Virtual scrolling enables better performance for large datasets */
		contain: layout style paint;
	}

	.table-container.loading {
		pointer-events: none;
		opacity: 0.7;
	}

	.table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	/* Error state styles */
	.error-cell {
		padding: 2rem;
		text-align: center;
		border: none;
		background: #fef2f2;
		color: #991b1b;
	}

	.inline-error {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.retry-btn {
		background: #dc2626;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s;
	}

	.retry-btn:hover {
		background: #b91c1c;
	}

	.retry-btn:focus {
		outline: 2px solid #fca5a5;
		outline-offset: 2px;
	}

	/* Loading state styles */
	.loading-cell {
		padding: 2rem;
		text-align: center;
		border: none;
		background: #f9fafb;
		color: #6b7280;
	}

	.inline-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid #e5e7eb;
		border-top: 2px solid #6b7280;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Empty state styles */
	.empty-cell {
		padding: 3rem;
		text-align: center;
		border: none;
		background: #fafafa;
		color: #64748b;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.empty-icon {
		font-size: 3rem;
		opacity: 0.5;
	}

	.empty-state h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 500;
		color: #374151;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}

	/* Virtual scrolling spacers */
	.virtual-spacer-top,
	.virtual-spacer-bottom {
		position: absolute;
		left: 0;
		right: 0;
		pointer-events: none;
	}

	.virtual-spacer-top {
		top: 0;
	}

	.virtual-spacer-bottom {
		bottom: 0;
	}

	/* Screen reader only */
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

	/* Scrollbar styling */
	.table-container::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.table-container::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 4px;
	}

	.table-container::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 4px;
	}

	.table-container::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}

	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.error-cell {
			background: #372019;
			color: #fca5a5;
		}

		.loading-cell {
			background: #1f2937;
			color: #9ca3af;
		}

		.empty-cell {
			background: #111827;
			color: #6b7280;
		}

		.empty-state h3 {
			color: #d1d5db;
		}

		.table-container::-webkit-scrollbar-track {
			background: #374151;
		}

		.table-container::-webkit-scrollbar-thumb {
			background: #6b7280;
		}

		.table-container::-webkit-scrollbar-thumb:hover {
			background: #9ca3af;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.table-container {
			border: 2px solid;
		}

		.retry-btn:focus,
		.table:focus {
			outline: 3px solid;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.table-container {
			max-height: 400px;
		}

		.error-cell,
		.loading-cell,
		.empty-cell {
			padding: 1.5rem;
		}

		.inline-error {
			flex-direction: column;
			gap: 0.75rem;
		}

		.empty-icon {
			font-size: 2rem;
		}
	}
</style>
