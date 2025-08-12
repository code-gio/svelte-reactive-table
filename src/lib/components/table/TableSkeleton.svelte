<!--
  TableSkeleton component - loading skeleton while table initializes
-->

<script lang="ts">
	interface Props {
		rows?: number;
		columns?: number;
		showHeader?: boolean;
	}

	let { 
		rows = 5, 
		columns = 4, 
		showHeader = true 
	}: Props = $props();

	// Generate arrays for iteration
	const headerCols = Array(columns).fill(0);
	const bodyRows = Array(rows).fill(0);
	const bodyCols = Array(columns).fill(0);
</script>

<!-- Skeleton table -->
<div class="table-skeleton" role="status" aria-label="Loading table data">
	<div class="skeleton-table">
		<!-- Skeleton header -->
		{#if showHeader}
			<div class="skeleton-header">
				{#each headerCols as _, i}
					<div 
						class="skeleton-header-cell"
						style="width: {100 / columns}%"
					>
						<div 
							class="skeleton-block header-block"
							style="width: {60 + Math.random() * 30}%"
						></div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Skeleton body -->
		<div class="skeleton-body">
			{#each bodyRows as _, rowIndex}
				<div class="skeleton-row">
					{#each bodyCols as _, colIndex}
						<div 
							class="skeleton-cell"
							style="width: {100 / columns}%"
						>
							<div 
								class="skeleton-block cell-block"
								style="width: {40 + Math.random() * 50}%; animation-delay: {(rowIndex * columns + colIndex) * 0.1}s"
							></div>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>

	<!-- Screen reader text -->
	<div class="sr-only">Loading table with {rows} rows and {columns} columns</div>
</div>

<style>
	.table-skeleton {
		width: 100%;
		background: var(--table-bg, #ffffff);
		border: 1px solid var(--table-border, #e2e8f0);
		border-radius: 0.5rem;
		overflow: hidden;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.skeleton-table {
		width: 100%;
	}

	/* Skeleton header */
	.skeleton-header {
		display: flex;
		background: var(--table-header-bg, #f7fafc);
		border-bottom: 1px solid var(--table-border, #e2e8f0);
		padding: 0.75rem 0;
	}

	.skeleton-header-cell {
		padding: 0 1rem;
		display: flex;
		align-items: center;
	}

	.header-block {
		height: 1rem;
		border-radius: 0.25rem;
	}

	/* Skeleton body */
	.skeleton-body {
		display: flex;
		flex-direction: column;
	}

	.skeleton-row {
		display: flex;
		border-bottom: 1px solid var(--table-border, #e2e8f0);
		padding: 0.75rem 0;
	}

	.skeleton-row:last-child {
		border-bottom: none;
	}

	.skeleton-cell {
		padding: 0 1rem;
		display: flex;
		align-items: center;
	}

	.cell-block {
		height: 0.875rem;
		border-radius: 0.25rem;
	}

	/* Skeleton animation */
	.skeleton-block {
		background: linear-gradient(
			90deg,
			var(--skeleton-base, #f1f5f9) 25%,
			var(--skeleton-shine, #e2e8f0) 50%,
			var(--skeleton-base, #f1f5f9) 75%
		);
		background-size: 200% 100%;
		animation: skeleton-loading 1.5s ease-in-out infinite;
	}

	@keyframes skeleton-loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
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

	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.table-skeleton {
			--skeleton-base: #374151;
			--skeleton-shine: #4b5563;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.skeleton-block {
			background: var(--table-border, #000000);
			opacity: 0.3;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.skeleton-block {
			animation: none;
			background: var(--skeleton-base, #f1f5f9);
		}
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.skeleton-header-cell,
		.skeleton-cell {
			padding: 0 0.75rem;
		}

		.skeleton-header,
		.skeleton-row {
			padding: 0.5rem 0;
		}

		.header-block {
			height: 0.875rem;
		}

		.cell-block {
			height: 0.75rem;
		}
	}

	/* Accessibility improvements */
	@media (prefers-reduced-motion: reduce) {
		.skeleton-block {
			animation-duration: 3s;
		}
	}
</style>