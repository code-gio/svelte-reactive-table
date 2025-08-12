<!--
  EditableCell component - handles inline editing for different column types
  Provides a unified editing interface with type-specific input controls
-->

<script lang="ts">
	import type { ColumnDefinition, DataRow, EditingOptions } from '../../types/core/index.js';

	interface Props {
		/** Current cell value */
		value: any;
		
		/** Column definition */
		column: ColumnDefinition;
		
		/** Row data (for context) */
		row: DataRow;
		
		/** Row ID */
		rowId: string;
		
		/** Column ID */
		columnId: string;
		
		/** Editing options */
		editingOptions: EditingOptions;
		
		/** Save handler */
		onSave: (newValue: any) => void | Promise<void>;
		
		/** Cancel handler */
		onCancel: () => void;
		
		/** Error handler */
		onError?: (error: Error) => void;
	}

	let {
		value,
		column,
		row,
		rowId,
		columnId,
		editingOptions,
		onSave,
		onCancel,
		onError
	}: Props = $props();

	// Internal state
	let editValue = $state(value);
	let inputElement = $state<HTMLElement>();
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	
	// Reactive validation
	const isValid = $derived(() => {
		if (!editingOptions.validateOnSave) return true;
		return validateValue(editValue);
	});
	
	const hasChanged = $derived(() => {
		return editValue !== value;
	});

	// Focus input when component mounts
	$effect(() => {
		if (inputElement) {
			inputElement.focus();
			
			// Select all text for easy replacement
			if (inputElement instanceof HTMLInputElement || inputElement instanceof HTMLTextAreaElement) {
				inputElement.select();
			}
		}
	});

	/**
	 * Handle save action
	 */
	async function handleSave(): Promise<void> {
		if (!isValid()) {
			error = 'Invalid value';
			return;
		}

		if (!hasChanged()) {
			onCancel();
			return;
		}

		try {
			isLoading = true;
			error = null;
			
			// Call editing options handler if provided
			if (editingOptions.onCellEditSave) {
				await editingOptions.onCellEditSave(rowId, columnId, value, editValue);
			}
			
			// Call component save handler
			await onSave(editValue);
			
		} catch (err) {
			const errorObj = err as Error;
			error = errorObj.message;
			
			// Call error handlers
			if (editingOptions.onCellEditError) {
				editingOptions.onCellEditError(rowId, columnId, errorObj);
			}
			if (onError) {
				onError(errorObj);
			}
		} finally {
			isLoading = false;
		}
	}

	/**
	 * Handle cancel action
	 */
	function handleCancel(): void {
		editValue = value; // Reset to original value
		error = null;
		
		if (editingOptions.onCellEditCancel) {
			editingOptions.onCellEditCancel(rowId, columnId, value);
		}
		
		onCancel();
	}

	/**
	 * Handle key events
	 */
	function handleKeyDown(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Enter':
				if (editingOptions.saveOnEnter !== false) {
					event.preventDefault();
					handleSave();
				}
				break;
				
			case 'Escape':
				if (editingOptions.cancelOnEscape !== false) {
					event.preventDefault();
					handleCancel();
				}
				break;
				
			case 'Tab':
				// Let Tab work normally for navigation between cells
				if (editingOptions.autoSave !== false) {
					handleSave();
				}
				break;
		}
	}

	/**
	 * Handle blur event
	 */
	function handleBlur(): void {
		if (editingOptions.autoSave !== false && !isLoading) {
			handleSave();
		}
	}

	/**
	 * Validate value based on column type and constraints
	 */
	function validateValue(val: any): boolean {
		if (column.required && (val == null || val === '')) {
			return false;
		}

		if (val == null || val === '') {
			return true; // Allow empty values if not required
		}

		switch (column.type) {
			case 'number':
			case 'currency':
			case 'percentage':
				return !isNaN(Number(val));
				
			case 'email':
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				return emailRegex.test(String(val));
				
			case 'url':
				try {
					new URL(String(val));
					return true;
				} catch {
					return false;
				}
				
			case 'date':
			case 'datetime':
			case 'time':
				const date = new Date(val);
				return !isNaN(date.getTime());
				
			default:
				return true;
		}
	}

	/**
	 * Format value for display in input
	 */
	function formatForInput(val: any): string {
		if (val == null) return '';
		
		switch (column.type) {
			case 'date':
				if (val instanceof Date) {
					return val.toISOString().split('T')[0];
				}
				return String(val);
				
			case 'datetime':
				if (val instanceof Date) {
					return val.toISOString().slice(0, 16);
				}
				return String(val);
				
			case 'time':
				if (val instanceof Date) {
					return val.toTimeString().slice(0, 8);
				}
				return String(val);
				
			default:
				return String(val);
		}
	}

	/**
	 * Parse input value based on column type
	 */
	function parseInputValue(val: string): any {
		if (val === '') return null;
		
		switch (column.type) {
			case 'number':
			case 'currency':
			case 'percentage':
				const num = Number(val);
				return isNaN(num) ? val : num;
				
			case 'boolean':
				return val === 'true' || val === '1' || val.toLowerCase() === 'yes';
				
			case 'date':
			case 'datetime':
			case 'time':
				const date = new Date(val);
				return isNaN(date.getTime()) ? val : date;
				
			case 'array':
				try {
					return JSON.parse(val);
				} catch {
					return val.split(',').map(s => s.trim());
				}
				
			case 'object':
				try {
					return JSON.parse(val);
				} catch {
					return val;
				}
				
			default:
				return val;
		}
	}

	// Update editValue when parsing changes
	$effect(() => {
		if (typeof editValue === 'string') {
			editValue = parseInputValue(editValue);
		}
	});
</script>

<div class="editable-cell" class:loading={isLoading} class:error={!!error}>
	<!-- Input based on column type -->
	{#if column.type === 'boolean'}
		<select
			bind:this={inputElement}
			bind:value={editValue}
			class="edit-input edit-select"
			onkeydown={handleKeyDown}
			onblur={handleBlur}
			disabled={isLoading}
		>
			<option value={true}>Yes</option>
			<option value={false}>No</option>
		</select>
		
	{:else if column.type === 'date'}
		<input
			bind:this={inputElement}
			bind:value={editValue}
			type="date"
			class="edit-input"
			onkeydown={handleKeyDown}
			onblur={handleBlur}
			disabled={isLoading}
		/>
		
	{:else if column.type === 'datetime'}
		<input
			bind:this={inputElement}
			bind:value={editValue}
			type="datetime-local"
			class="edit-input"
			onkeydown={handleKeyDown}
			onblur={handleBlur}
			disabled={isLoading}
		/>
		
	{:else if column.type === 'time'}
		<input
			bind:this={inputElement}
			bind:value={editValue}
			type="time"
			class="edit-input"
			onkeydown={handleKeyDown}
			onblur={handleBlur}
			disabled={isLoading}
		/>
		
	{:else if column.type === 'number' || column.type === 'currency' || column.type === 'percentage'}
		<input
			bind:this={inputElement}
			bind:value={editValue}
			type="number"
			class="edit-input"
			step={column.type === 'currency' ? '0.01' : 'any'}
			min={column.min}
			max={column.max}
			onkeydown={handleKeyDown}
			onblur={handleBlur}
			disabled={isLoading}
		/>
		
	{:else if column.type === 'email'}
		<input
			bind:this={inputElement}
			bind:value={editValue}
			type="email"
			class="edit-input"
			onkeydown={handleKeyDown}
			onblur={handleBlur}
			disabled={isLoading}
		/>
		
	{:else if column.type === 'url'}
		<input
			bind:this={inputElement}
			bind:value={editValue}
			type="url"
			class="edit-input"
			onkeydown={handleKeyDown}
			onblur={handleBlur}
			disabled={isLoading}
		/>
		
	{:else if column.type === 'array' || column.type === 'object'}
		<textarea
			bind:this={inputElement}
			bind:value={editValue}
			class="edit-input edit-textarea"
			rows="3"
			onkeydown={handleKeyDown}
			onblur={handleBlur}
			disabled={isLoading}
		></textarea>
		
	{:else}
		<!-- Default text input -->
		<input
			bind:this={inputElement}
			bind:value={editValue}
			type="text"
			class="edit-input"
			maxlength={column.maxLength}
			onkeydown={handleKeyDown}
			onblur={handleBlur}
			disabled={isLoading}
		/>
	{/if}

	<!-- Action buttons (if enabled) -->
	{#if editingOptions.showButtons}
		<div class="edit-buttons">
			<button
				type="button"
				class="edit-btn edit-save"
				onclick={handleSave}
				disabled={isLoading || !isValid()}
				title="Save (Enter)"
			>
				{#if isLoading}
					<div class="spinner" aria-hidden="true"></div>
				{:else}
					✓
				{/if}
			</button>
			<button
				type="button"
				class="edit-btn edit-cancel"
				onclick={handleCancel}
				disabled={isLoading}
				title="Cancel (Escape)"
			>
				✕
			</button>
		</div>
	{/if}

	<!-- Error message -->
	{#if error}
		<div class="edit-error" role="alert">
			{error}
		</div>
	{/if}

	<!-- Loading indicator -->
	{#if isLoading && !editingOptions.showButtons}
		<div class="edit-loading" aria-hidden="true">
			<div class="spinner"></div>
		</div>
	{/if}
</div>

<style>
	.editable-cell {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		min-width: 100px;
		width: 100%;
	}

	.edit-input {
		flex: 1;
		min-width: 0;
		padding: 0.25rem 0.5rem;
		border: 2px solid var(--table-edit-border, #3b82f6);
		border-radius: 0.25rem;
		font-size: inherit;
		font-family: inherit;
		background: var(--table-edit-bg, #ffffff);
		color: var(--table-edit-text, inherit);
		outline: none;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.edit-input:focus {
		border-color: var(--table-edit-focus, #1d4ed8);
		box-shadow: 0 0 0 3px var(--table-edit-focus-ring, rgba(59, 130, 246, 0.1));
	}

	.edit-input:invalid,
	.error .edit-input {
		border-color: var(--table-edit-error, #ef4444);
	}

	.edit-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.edit-select {
		cursor: pointer;
	}

	.edit-textarea {
		resize: vertical;
		min-height: 2.5rem;
	}

	/* Action buttons */
	.edit-buttons {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.edit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border: 1px solid transparent;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.edit-save {
		background: var(--table-edit-save, #10b981);
		color: white;
		border-color: var(--table-edit-save, #10b981);
	}

	.edit-save:hover:not(:disabled) {
		background: var(--table-edit-save-hover, #059669);
	}

	.edit-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.edit-cancel {
		background: var(--table-edit-cancel, #ef4444);
		color: white;
		border-color: var(--table-edit-cancel, #ef4444);
	}

	.edit-cancel:hover:not(:disabled) {
		background: var(--table-edit-cancel-hover, #dc2626);
	}

	/* Loading spinner */
	.spinner {
		width: 0.875rem;
		height: 0.875rem;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.edit-loading {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
	}

	/* Error message */
	.edit-error {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		padding: 0.25rem 0.5rem;
		background: var(--table-edit-error-bg, #fef2f2);
		color: var(--table-edit-error-text, #dc2626);
		border: 1px solid var(--table-edit-error, #ef4444);
		border-radius: 0.25rem;
		font-size: 0.75rem;
		z-index: 10;
		margin-top: 0.25rem;
	}

	/* Loading state */
	.loading {
		pointer-events: none;
	}

	.loading .edit-input {
		opacity: 0.7;
	}

	/* Dark mode */
	@media (prefers-color-scheme: dark) {
		.edit-input {
			background: var(--table-edit-bg, #374151);
			border-color: var(--table-edit-border, #60a5fa);
			color: var(--table-edit-text, #f9fafb);
		}

		.edit-input:focus {
			border-color: var(--table-edit-focus, #3b82f6);
			box-shadow: 0 0 0 3px var(--table-edit-focus-ring, rgba(96, 165, 250, 0.2));
		}

		.edit-error {
			background: var(--table-edit-error-bg, #7f1d1d);
			color: var(--table-edit-error-text, #fca5a5);
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.edit-input {
			border-width: 3px;
		}

		.edit-input:focus {
			box-shadow: 0 0 0 3px;
		}

		.edit-btn {
			border-width: 2px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.edit-input,
		.edit-btn {
			transition: none;
		}

		.spinner {
			animation: none;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.editable-cell {
			min-width: 80px;
		}

		.edit-input {
			padding: 0.375rem 0.5rem;
			font-size: 0.875rem;
		}

		.edit-btn {
			width: 2rem;
			height: 2rem;
		}

		.edit-buttons {
			gap: 0.375rem;
		}
	}

	/* Print styles */
	@media print {
		.editable-cell {
			display: none;
		}
	}
</style>