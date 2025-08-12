<!--
  ColumnResizer component - handle for resizing table columns
-->

<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		onResize: (width: number) => void;
		minWidth?: number;
		maxWidth?: number;
	}

	let { onResize, minWidth = 50, maxWidth = 500 }: Props = $props();

	let resizerElement: HTMLButtonElement;
	let isResizing = $state(false);
	let startX = $state(0);
	let startWidth = $state(0);

	// Handle resize start
	function handleMouseDown(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		isResizing = true;
		startX = event.clientX;

		// Get current column width
		const headerCell = resizerElement.closest('th');
		if (headerCell) {
			startWidth = headerCell.getBoundingClientRect().width;
		}

		// Add global event listeners
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		// Add cursor to body
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
	}

	// Handle resize move
	function handleMouseMove(event: MouseEvent) {
		if (!isResizing) return;

		const deltaX = event.clientX - startX;
		const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));

		// Update column width immediately for visual feedback
		const headerCell = resizerElement.closest('th');
		if (headerCell) {
			headerCell.style.width = `${newWidth}px`;
		}

		// Call resize handler
		onResize(newWidth);
	}

	// Handle resize end
	function handleMouseUp() {
		if (!isResizing) return;

		isResizing = false;
		startX = 0;
		startWidth = 0;

		// Remove global event listeners
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);

		// Reset body cursor
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
	}

	// Handle keyboard resizing
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			event.preventDefault();
			event.stopPropagation();

			const headerCell = resizerElement.closest('th');
			if (!headerCell) return;

			const currentWidth = headerCell.getBoundingClientRect().width;
			const delta = event.shiftKey ? 10 : 5; // Larger steps with Shift
			const newWidth =
				event.key === 'ArrowLeft'
					? Math.max(minWidth, currentWidth - delta)
					: Math.min(maxWidth, currentWidth + delta);

			// Update width
			headerCell.style.width = `${newWidth}px`;
			onResize(newWidth);
		}
	}

	// Handle touch events for mobile
	function handleTouchStart(event: TouchEvent) {
		event.preventDefault();
		event.stopPropagation();

		const touch = event.touches[0];
		if (!touch) return;

		isResizing = true;
		startX = touch.clientX;

		const headerCell = resizerElement.closest('th');
		if (headerCell) {
			startWidth = headerCell.getBoundingClientRect().width;
		}

		// Add touch event listeners
		document.addEventListener('touchmove', handleTouchMove, { passive: false });
		document.addEventListener('touchend', handleTouchEnd);
	}

	function handleTouchMove(event: TouchEvent) {
		if (!isResizing) return;

		event.preventDefault();
		const touch = event.touches[0];
		if (!touch) return;

		const deltaX = touch.clientX - startX;
		const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));

		const headerCell = resizerElement.closest('th');
		if (headerCell) {
			headerCell.style.width = `${newWidth}px`;
		}

		onResize(newWidth);
	}

	function handleTouchEnd() {
		if (!isResizing) return;

		isResizing = false;
		startX = 0;
		startWidth = 0;

		document.removeEventListener('touchmove', handleTouchMove);
		document.removeEventListener('touchend', handleTouchEnd);
	}

	// Cleanup on destroy
	onMount(() => {
		return () => {
			// Cleanup any active resize operation
			if (isResizing) {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
				document.removeEventListener('touchmove', handleTouchMove);
				document.removeEventListener('touchend', handleTouchEnd);

				document.body.style.cursor = '';
				document.body.style.userSelect = '';
			}
		};
	});
</script>

<!-- Column resizer handle -->
<button
	bind:this={resizerElement}
	class="column-resizer"
	class:resizing={isResizing}
	aria-label="Resize column"
	type="button"
	onmousedown={handleMouseDown}
	onkeydown={handleKeyDown}
	ontouchstart={handleTouchStart}
	title="Drag to resize column (or use arrow keys)"
>
	<!-- Visual indicator -->
	<div class="resizer-handle" aria-hidden="true"></div>
</button>

<style>
	.column-resizer {
		position: absolute;
		top: 0;
		right: -2px;
		bottom: 0;
		width: 4px;
		cursor: col-resize;
		background: transparent;
		z-index: 1;
		user-select: none;
		touch-action: none;
	}

	.column-resizer:hover,
	.column-resizer:focus {
		background: var(--table-resizer-hover, rgba(59, 130, 246, 0.1));
	}

	.column-resizer:focus {
		outline: 2px solid var(--table-focus, #3b82f6);
		outline-offset: -1px;
	}

	.column-resizer.resizing {
		background: var(--table-resizer-active, rgba(59, 130, 246, 0.2));
	}

	/* Visual handle */
	.resizer-handle {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 2px;
		height: 20px;
		background: var(--table-resizer-handle, #cbd5e1);
		border-radius: 1px;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.column-resizer:hover .resizer-handle,
	.column-resizer:focus .resizer-handle,
	.column-resizer.resizing .resizer-handle {
		opacity: 1;
		background: var(--table-resizer-handle-active, #3b82f6);
	}

	/* Extended hit area on hover */
	.column-resizer::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: -2px;
		right: -2px;
		background: transparent;
	}

	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.column-resizer:hover,
		.column-resizer:focus {
			background: var(--table-resizer-hover, rgba(96, 165, 250, 0.1));
		}

		.column-resizer.resizing {
			background: var(--table-resizer-active, rgba(96, 165, 250, 0.2));
		}

		.resizer-handle {
			background: var(--table-resizer-handle, #6b7280);
		}

		.column-resizer:hover .resizer-handle,
		.column-resizer:focus .resizer-handle,
		.column-resizer.resizing .resizer-handle {
			background: var(--table-resizer-handle-active, #60a5fa);
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.resizer-handle {
			background: currentColor;
			opacity: 0.7;
		}

		.column-resizer:hover .resizer-handle,
		.column-resizer:focus .resizer-handle,
		.column-resizer.resizing .resizer-handle {
			opacity: 1;
			background: currentColor;
		}

		.column-resizer:focus {
			outline: 3px solid;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.resizer-handle {
			transition: none;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.column-resizer {
			width: 6px;
			right: -3px;
		}

		.column-resizer::before {
			left: -3px;
			right: -3px;
		}

		.resizer-handle {
			width: 3px;
			height: 24px;
		}
	}

	/* Touch devices */
	@media (pointer: coarse) {
		.column-resizer {
			width: 8px;
			right: -4px;
		}

		.resizer-handle {
			width: 4px;
			height: 28px;
			opacity: 0.3;
		}
	}

	/* Print styles */
	@media print {
		.column-resizer {
			display: none;
		}
	}
</style>
