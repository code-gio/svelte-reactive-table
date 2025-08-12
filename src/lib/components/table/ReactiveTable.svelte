<!--
  Main ReactiveTable component for svelte-reactive-table
  This is the primary component users will import and use
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { ReactiveTable } from '../../core/ReactiveTable.svelte.js';
	import TableContainer from './TableContainer.svelte';
	import TableSkeleton from './TableSkeleton.svelte';
	import type { TableConfig, TableProps, DataRow } from '../../types/core/index.js';

	// Component props using Svelte 5 syntax
	interface Props<T extends DataRow = DataRow> extends TableProps<T> {
		config: TableConfig<T>;
		class?: string;
		style?: string;
	}

	let { config, class: className = '', style = '' }: Props = $props();

	// Create reactive table instance
	let tableInstance = $state<ReactiveTable<any> | null>(null);
	let mounted = $state(false);
	let error = $state<string | null>(null);

	// Initialize table instance
	onMount(async () => {
		try {
			tableInstance = new ReactiveTable(config);
			mounted = true;

			// Auto-connect is handled by ReactiveTable constructor
		} catch (err) {
			error = (err as Error).message;
			console.error('Failed to initialize ReactiveTable:', err);
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		if (tableInstance) {
			tableInstance.destroy();
		}
	});

	// Reactive state from table instance (using Svelte 5 runes)
	const tableState = $derived(() => {
		if (!tableInstance || !mounted) return null;
		return tableInstance.state;
	});

	// Derived states for template
	const isLoading = $derived(() => tableState()?.loading ?? true);
	const hasError = $derived(() => tableState()?.error ?? error);
	const isConnected = $derived(() => tableState()?.connected ?? false);
	const hasData = $derived(() => (tableState()?.paginatedData?.length ?? 0) > 0);

	// Expose table instance to parent components
	export function getTableInstance() {
		return tableInstance;
	}

	// Public API methods for parent components
	export async function refresh() {
		if (tableInstance) {
			await tableInstance.refresh();
		}
	}

	export function getStats() {
		if (tableInstance) {
			return tableInstance.getStats();
		}
		return null;
	}

	export function exportData(format: 'json' | 'csv' = 'json') {
		if (tableInstance) {
			return tableInstance.export(format);
		}
		return null;
	}
</script>

<!-- Main table wrapper -->
<div
	class="reactive-table {className}"
	{style}
	role="region"
	aria-label={config.options?.accessibility?.ariaLabel || 'Data table'}
	aria-describedby={config.options?.accessibility?.ariaDescription
		? 'table-description'
		: undefined}
>
	<!-- Optional description for screen readers -->
	{#if config.options?.accessibility?.ariaDescription}
		<div id="table-description" class="sr-only">
			{config.options.accessibility.ariaDescription}
		</div>
	{/if}

	<!-- Error state -->
	{#if hasError()}
		<div class="table-error" role="alert" aria-live="polite">
			<div class="error-icon" aria-hidden="true">⚠️</div>
			<div class="error-content">
				<h3>Table Error</h3>
				<p>{hasError()}</p>
				<button type="button" class="error-retry-btn" onclick={() => refresh()}> Try Again </button>
			</div>
		</div>
	{:else if isLoading() && !isConnected()}
		<!-- Loading skeleton -->
		<TableSkeleton />
	{:else if mounted && tableInstance}
		<!-- Main table content -->
		<TableContainer {tableInstance} />
	{:else}
		<!-- Initial loading -->
		<div class="table-initializing" role="status" aria-live="polite">
			<div class="loading-spinner" aria-hidden="true"></div>
			<span>Initializing table...</span>
		</div>
	{/if}
</div>

<style>
	.reactive-table {
		--table-bg: #ffffff;
		--table-border: #e2e8f0;
		--table-text: #1a202c;
		--table-header-bg: #f7fafc;
		--table-row-hover: #f7fafc;
		--table-selected: #ebf8ff;
		--table-error: #feb2b2;
		--table-loading: #a0aec0;

		width: 100%;
		background-color: var(--table-bg);
		border: 1px solid var(--table-border);
		border-radius: 0.5rem;
		overflow: hidden;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		color: var(--table-text);
	}

	/* Error state styles */
	.table-error {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		background-color: var(--table-error);
		border-radius: 0.5rem;
	}

	.error-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.error-content h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.error-content p {
		margin: 0 0 1rem 0;
		color: #744210;
	}

	.error-retry-btn {
		background: #ffffff;
		border: 1px solid #d69e2e;
		color: #744210;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s;
	}

	.error-retry-btn:hover {
		background: #f7fafc;
		transform: translateY(-1px);
	}

	.error-retry-btn:active {
		transform: translateY(0);
	}

	/* Initializing state styles */
	.table-initializing {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 3rem;
		color: var(--table-loading);
		font-size: 0.875rem;
	}

	.loading-spinner {
		width: 1.5rem;
		height: 1.5rem;
		border: 2px solid #e2e8f0;
		border-top: 2px solid var(--table-loading);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
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

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.reactive-table {
			--table-bg: #1a202c;
			--table-border: #4a5568;
			--table-text: #f7fafc;
			--table-header-bg: #2d3748;
			--table-row-hover: #2d3748;
			--table-selected: #2a4a5c;
			--table-error: #fc8181;
			--table-loading: #718096;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.reactive-table {
			--table-border: #000000;
			--table-text: #000000;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.loading-spinner {
			animation: none;
		}

		.error-retry-btn:hover {
			transform: none;
		}

		.error-retry-btn:active {
			transform: none;
		}
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.reactive-table {
			border-radius: 0;
			border-left: none;
			border-right: none;
		}

		.table-error {
			padding: 1.5rem;
			flex-direction: column;
			text-align: center;
		}

		.error-icon {
			font-size: 3rem;
		}
	}
</style>
