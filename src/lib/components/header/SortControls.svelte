<!--
  SortControls component - displays sort direction indicators
-->

<script lang="ts">
	import type { SortDirection } from '../../types/core/index.js';

	interface Props {
		direction?: SortDirection;
		priority?: number;
	}

	let { direction, priority }: Props = $props();

	// Determine which arrows to show
	const showUpArrow = $derived(() => direction === 'asc');
	const showDownArrow = $derived(() => direction === 'desc');

	// Priority display (for multi-column sorting)
	const showPriority = $derived(() => typeof priority === 'number' && priority > 0);
</script>

<!-- Sort control container -->
<div class="sort-controls" class:active={!!direction} aria-hidden="true">
	<!-- Sort arrows -->
	<div class="sort-arrows">
		<!-- Up arrow (ascending) -->
		<svg
			class="sort-arrow sort-arrow-up"
			class:active={showUpArrow()}
			class:inactive={showDownArrow()}
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="currentColor"
		>
			<path d="M6 2L10 8H2L6 2Z" />
		</svg>

		<!-- Down arrow (descending) -->
		<svg
			class="sort-arrow sort-arrow-down"
			class:active={showDownArrow()}
			class:inactive={showUpArrow()}
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="currentColor"
		>
			<path d="M6 10L2 4H10L6 10Z" />
		</svg>
	</div>

	<!-- Priority indicator for multi-sort -->
	{#if showPriority()}
		<div class="sort-priority" title="Sort priority: {priority}">
			{priority}
		</div>
	{/if}
</div>

<style>
	.sort-controls {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--table-text-muted, #9ca3af);
		transition: color 0.2s ease;
	}

	.sort-controls.active {
		color: var(--table-text-active, #3b82f6);
	}

	.sort-arrows {
		display: flex;
		flex-direction: column;
		gap: 1px;
		align-items: center;
	}

	.sort-arrow {
		display: block;
		width: 12px;
		height: 6px;
		opacity: 0.4;
		transition:
			opacity 0.2s ease,
			color 0.2s ease;
	}

	.sort-arrow.active {
		opacity: 1;
		color: var(--table-sort-active, #1d4ed8);
	}

	.sort-arrow.inactive {
		opacity: 0.2;
	}

	/* Hover states for better UX */
	.sort-controls:hover .sort-arrow {
		opacity: 0.7;
	}

	.sort-controls:hover .sort-arrow.active {
		opacity: 1;
	}

	/* Priority indicator */
	.sort-priority {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		font-size: 10px;
		font-weight: 700;
		color: white;
		background: var(--table-sort-active, #1d4ed8);
		border-radius: 50%;
		line-height: 1;
	}

	/* Alternative text-based arrows (fallback) */
	@supports not (fill: currentColor) {
		.sort-arrow-up::before {
			content: '▲';
			font-size: 8px;
		}

		.sort-arrow-down::before {
			content: '▼';
			font-size: 8px;
		}

		.sort-arrow path {
			display: none;
		}
	}

	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.sort-controls {
			color: var(--table-text-muted, #6b7280);
		}

		.sort-controls.active {
			color: var(--table-text-active, #60a5fa);
		}

		.sort-arrow.active {
			color: var(--table-sort-active, #3b82f6);
		}

		.sort-priority {
			background: var(--table-sort-active, #3b82f6);
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.sort-arrow {
			opacity: 0.8;
		}

		.sort-arrow.active {
			opacity: 1;
			stroke: currentColor;
			stroke-width: 1;
		}

		.sort-priority {
			border: 2px solid currentColor;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.sort-controls,
		.sort-arrow {
			transition: none;
		}
	}

	/* Print styles */
	@media print {
		.sort-controls {
			color: #666 !important;
		}

		.sort-arrow.active {
			color: black !important;
		}

		.sort-priority {
			background: #666 !important;
			color: white !important;
		}
	}
</style>
