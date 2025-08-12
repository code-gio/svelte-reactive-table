<!--
  TableCell component - renders individual table cell with formatted content
-->

<script lang="ts">
	import type { DataRow, ColumnDefinition } from '../../types/core/index.js';

	interface Props {
		row: DataRow;
		column: ColumnDefinition;
		width: string;
		value: any;
	}

	let { row, column, width, value }: Props = $props();

	// Format cell value based on column type and formatter
	const formattedValue = $derived(() => {
		// Handle null/undefined values
		if (value == null) {
			return column.defaultValue ?? '';
		}

		// Use custom formatter if provided
		if (column.formatter) {
			try {
				return column.formatter(value, row);
			} catch (error) {
				console.warn('Error in column formatter:', error);
				return String(value);
			}
		}

		// Format based on column type
		switch (column.type) {
			case 'number':
				if (typeof value === 'number') {
					return column.precision !== undefined
						? value.toFixed(column.precision)
						: value.toString();
				}
				return String(value);

			case 'currency':
				if (typeof value === 'number') {
					return new Intl.NumberFormat('en-US', {
						style: 'currency',
						currency: 'USD'
					}).format(value);
				}
				return String(value);

			case 'percentage':
				if (typeof value === 'number') {
					return `${(value * 100).toFixed(1)}%`;
				}
				return String(value);

			case 'date':
				if (value instanceof Date) {
					return value.toLocaleDateString();
				}
				if (typeof value === 'string' || typeof value === 'number') {
					const date = new Date(value);
					return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
				}
				return String(value);

			case 'datetime':
				if (value instanceof Date) {
					return value.toLocaleString();
				}
				if (typeof value === 'string' || typeof value === 'number') {
					const date = new Date(value);
					return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
				}
				return String(value);

			case 'time':
				if (value instanceof Date) {
					return value.toLocaleTimeString();
				}
				if (typeof value === 'string') {
					const date = new Date(`1970-01-01T${value}`);
					return isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString();
				}
				return String(value);

			case 'boolean':
				if (typeof value === 'boolean') {
					return value ? 'Yes' : 'No';
				}
				return String(value);

			case 'array':
				if (Array.isArray(value)) {
					return value.join(', ');
				}
				return String(value);

			case 'object':
				if (typeof value === 'object' && value !== null) {
					return JSON.stringify(value, null, 0);
				}
				return String(value);

			case 'email':
				return String(value);

			case 'url':
				return String(value);

			case 'text':
			default:
				return String(value);
		}
	});

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

	// Get cell type classes
	const typeClass = $derived(() => `cell-${column.type}`);

	// Handle cell click if column has click handler
	function handleCellClick(event: MouseEvent) {
		if (column.onClick) {
			event.stopPropagation(); // Prevent row click
			column.onClick(value, row, column);
		}
	}

	// Check if cell content should be truncated
	const shouldTruncate = $derived(() => column.truncate !== false);

	// Generate cell ID for accessibility
	const cellId = `cell-${String(column.id)}-${String(row.id)}`;

	// Get cell title for tooltip (useful for truncated content)
	const cellTitle = $derived(() => {
		const value = formattedValue();
		if (shouldTruncate() && typeof value === 'string' && value.length > 50) {
			return value;
		}
		return column.description || undefined;
	});
</script>

<!-- Table cell -->
<td
	id={cellId}
	class="table-cell {alignmentClass()} {typeClass()}"
	class:clickable={!!column.onClick}
	class:truncate={shouldTruncate()}
	style="width: {width}; min-width: {column.minWidth || 'auto'}; max-width: {column.maxWidth ||
		'none'}"
	role="cell"
	title={cellTitle() || undefined}
	onclick={column.onClick ? handleCellClick : undefined}
>
	<!-- Cell content wrapper -->
	<div class="cell-content">
		{#if column.type === 'boolean' && typeof value === 'boolean'}
			<!-- Boolean indicator -->
			<div class="boolean-indicator" class:true={value} class:false={!value}>
				<svg
					class="boolean-icon"
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="currentColor"
					aria-hidden="true"
				>
					{#if value}
						<path
							d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"
						/>
					{:else}
						<path
							d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
						/>
					{/if}
				</svg>
				<span class="sr-only">{value ? 'True' : 'False'}</span>
			</div>
		{:else if column.type === 'email'}
			<!-- Email link -->
			<a href="mailto:{value}" class="email-link">
				{formattedValue()}
			</a>
		{:else if column.type === 'url'}
			<!-- URL link -->
			<a href={value} target="_blank" rel="noopener noreferrer" class="url-link">
				{formattedValue()}
				<svg
					class="external-icon"
					width="12"
					height="12"
					viewBox="0 0 12 12"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						d="M6.5 1A.5.5 0 0 1 7 1.5V3h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V4H3.5a.5.5 0 0 1 0-1H6V1.5A.5.5 0 0 1 6.5 1z"
					/>
				</svg>
				<span class="sr-only">(opens in new tab)</span>
			</a>
		{:else}
			<!-- Default text content -->
			<span class="cell-text">{formattedValue()}</span>
		{/if}
	</div>
</td>

<style>
	.table-cell {
		padding: 0.75rem 1rem;
		vertical-align: middle;
		border-right: 1px solid var(--table-border, #e2e8f0);
		background: inherit;
		color: inherit;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.table-cell:last-child {
		border-right: none;
	}

	/* Clickable cells */
	.table-cell.clickable {
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.table-cell.clickable:hover {
		background: var(--table-cell-hover, rgba(59, 130, 246, 0.05));
	}

	/* Text truncation */
	.table-cell.truncate {
		max-width: 200px;
	}

	.table-cell.truncate .cell-content {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Cell content wrapper */
	.cell-content {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: 1.25rem;
	}

	.cell-text {
		flex: 1;
		min-width: 0;
	}

	/* Text alignment */
	.text-left .cell-content {
		justify-content: flex-start;
	}

	.text-center .cell-content {
		justify-content: center;
	}

	.text-right .cell-content {
		justify-content: flex-end;
	}

	/* Type-specific styling */
	.cell-number,
	.cell-currency,
	.cell-percentage {
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.cell-date,
	.cell-datetime,
	.cell-time {
		font-variant-numeric: tabular-nums;
	}

	/* Boolean indicators */
	.boolean-indicator {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.boolean-indicator.true {
		color: var(--table-success, #10b981);
	}

	.boolean-indicator.false {
		color: var(--table-error, #ef4444);
	}

	.boolean-icon {
		flex-shrink: 0;
	}

	/* Link styles */
	.email-link,
	.url-link {
		color: var(--table-link, #3b82f6);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		transition: color 0.2s ease;
	}

	.email-link:hover,
	.url-link:hover {
		color: var(--table-link-hover, #1d4ed8);
		text-decoration: underline;
	}

	.email-link:focus,
	.url-link:focus {
		outline: 2px solid var(--table-focus, #3b82f6);
		outline-offset: 2px;
		border-radius: 0.25rem;
	}

	.external-icon {
		flex-shrink: 0;
		opacity: 0.6;
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
		.table-cell {
			border-right-color: var(--table-border, #4a5568);
		}

		.table-cell.clickable:hover {
			background: var(--table-cell-hover, rgba(96, 165, 250, 0.1));
		}

		.boolean-indicator.true {
			color: var(--table-success, #34d399);
		}

		.boolean-indicator.false {
			color: var(--table-error, #f87171);
		}

		.email-link,
		.url-link {
			color: var(--table-link, #60a5fa);
		}

		.email-link:hover,
		.url-link:hover {
			color: var(--table-link-hover, #3b82f6);
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.table-cell {
			border-right: 2px solid;
		}

		.email-link,
		.url-link {
			text-decoration: underline;
		}

		.email-link:focus,
		.url-link:focus {
			outline: 3px solid;
		}
	}

	/* Print styles */
	@media print {
		.table-cell {
			background: white !important;
			color: black !important;
			border-right: 1px solid black;
		}

		.table-cell.clickable {
			cursor: default;
		}

		.email-link,
		.url-link {
			color: black !important;
			text-decoration: underline;
		}

		.external-icon {
			display: none;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.table-cell {
			padding: 0.5rem 0.75rem;
			font-size: 0.8125rem;
		}

		.table-cell.truncate {
			max-width: 120px;
		}

		.boolean-icon {
			width: 14px;
			height: 14px;
		}

		.external-icon {
			width: 10px;
			height: 10px;
		}
	}
</style>
