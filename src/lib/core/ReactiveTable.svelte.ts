/**
 * Main reactive table component for svelte-reactive-table
 */

// Removed Svelte lifecycle imports - using runes instead
import { TableEngine } from './TableEngine.svelte.js';
import { ReactiveTableState } from './TableState.svelte.js';
import type { 
	TableConfig, 
	TableOptions, 
	DataRow, 
	DataChangeEvent,
	TableSchema,
	TableFilter,
	TableSort,
	TableEvents,
	ReactiveTableInstance,
	EditingOptions
} from '../types/core/index.js';
import type { BaseAdapter } from '../adapters/base/BaseAdapter.js';
import { createAdapter } from '../adapters/index.js';

/**
 * Main ReactiveTable class using Svelte 5 runes
 */
export class ReactiveTable<T extends DataRow = DataRow> implements ReactiveTableInstance<T> {
	// Configuration (immutable)
	readonly config: TableConfig<T>;
	
	// State management
	private _state: ReactiveTableState<T>;
	private _engine: TableEngine<T>;
	private _adapter: BaseAdapter<T>;
	
	// Subscriptions and cleanup
	private _unsubscribeAdapter?: () => void;
	private _destroyed = false;
	
	// Cell editing state
	private _editingCell = $state<string | null>(null); // Format: "rowId:columnId"
	private _editingOptions = $state<EditingOptions | null>(null);
	
	constructor(config: TableConfig<T>) {
		this.config = { ...config };
		
		// Create adapter instance if config object is passed
		if (typeof config.adapter === 'object' && 'type' in config.adapter) {
			this._adapter = createAdapter<T>(config.adapter, config.initialData);
		} else {
			this._adapter = config.adapter as BaseAdapter<T>;
		}
		
		// Initialize state with runes
		this._state = new ReactiveTableState<T>(config.options || {});
		this._engine = new TableEngine<T>(this._state, config.schema);
		
		// Initialize editing options if provided
		if (config.options?.editing) {
			this._editingOptions = {
				trigger: 'click',
				autoSave: true,
				saveOnEnter: true,
				cancelOnEscape: true,
				showButtons: false,
				validateOnSave: true,
				...config.options.editing
			};
		}
		
		// Set up reactive effects
		this.setupReactiveEffects();
		
		// Load initial data for memory adapters
		if (typeof config.adapter === 'object' && 'type' in config.adapter && config.adapter.type === 'memory') {
			// Load initial data immediately for memory adapters
			this._adapter.read().then(initialData => {
				this._state.setData(initialData);
			}).catch(error => {
				console.error('Failed to load initial data:', error);
				this._state.setError(error.message);
			});
		}
		
		// Auto-connect if specified (but not for memory adapters)
		if (config.options?.realtime !== false && 
			!(typeof config.adapter === 'object' && 'type' in config.adapter && config.adapter.type === 'memory')) {
			// Use a longer delay to ensure adapter is fully initialized
			setTimeout(() => {
				// Double-check that the instance hasn't been destroyed
				if (!this._destroyed && this._adapter) {
					this.connect().catch(error => {
						console.error('Failed to auto-connect:', error);
						this._state.setError(error.message);
					});
				}
			}, 50);
		}
	}
	
	/**
	 * Get current table state (reactive)
	 */
	get state() {
		return this._state.getPublicState();
	}
	
	/**
	 * Get current editing state (reactive)
	 */
	get editingCell() {
		return this._editingCell;
	}
	
	/**
	 * Get editing options (reactive)
	 */
	get editingOptions() {
		return this._editingOptions;
	}
	
	/**
	 * Setup reactive patterns using derived state instead of effects
	 */
	private setupReactiveEffects() {
		// Instead of $effect, we'll use explicit synchronization methods
		// that can be called when needed, avoiding potential loops
		
		// Sync adapter state (called explicitly when adapter state changes)
		this.syncAdapterState();
		
		// Setup real-time sync if configured (called once during initialization)
		if (this.config.options?.realtime !== false) {
			this.setupRealtimeSync();
		}
	}
	
	/**
	 * Sync adapter state explicitly (avoiding $effect loops)
	 */
	private syncAdapterState() {
		if (this._destroyed || !this._adapter) return;
		
		const adapterState = this._adapter.getState();
		
		// Sync loading state
		this._state.setLoading(adapterState.loading);
		
		// Sync connection state  
		this._state.setConnected(adapterState.connected);
		
		// Sync error state
		this._state.setError(adapterState.error);
	}
	
	/**
	 * Setup real-time synchronization
	 */
	private setupRealtimeSync() {
		if (!this._adapter) return;
		
		if (this._unsubscribeAdapter) {
			this._unsubscribeAdapter();
		}
		
		this._unsubscribeAdapter = this._adapter.subscribe((event: DataChangeEvent<T>) => {
			if (this._destroyed) return;
			
			switch (event.type) {
				case 'create':
					this._state.addRows(event.rows);
					break;
				case 'update':
					event.rows.forEach((row: T) => {
						this._state.updateRow(row.id, row);
					});
					break;
				case 'delete':
					event.rows.forEach(row => {
						this._state.removeRow(row.id);
					});
					break;
				case 'bulk_update':
					this._state.replaceData(event.rows);
					break;
			}
		});
	}
	
	// Public API methods
	
	/**
	 * Connect to data source
	 */
	async connect(): Promise<void> {
		if (this._destroyed || !this._adapter) {
			throw new Error('Table instance has been destroyed or adapter not initialized');
		}
		
		try {
			this._state.setLoading(true);
			await this._adapter.connect();
			
			// Load initial data
			const initialData = await this._adapter.read();
			this._state.setData(initialData);
			
			// Trigger data processing explicitly
			this._engine.triggerDataValidation();
			
		} catch (error) {
			this._state.setError((error as Error).message);
			throw error;
		} finally {
			this._state.setLoading(false);
		}
	}
	
	/**
	 * Disconnect from data source
	 */
	async disconnect(): Promise<void> {
		if (this._unsubscribeAdapter) {
			this._unsubscribeAdapter();
			this._unsubscribeAdapter = undefined;
		}
		
		await this._adapter.disconnect();
		this._state.setConnected(false);
	}
	
	/**
	 * Refresh data from source
	 */
	async refresh(): Promise<void> {
		if (this._destroyed) return;
		
		try {
			this._state.setLoading(true);
			const freshData = await this._adapter.read({
				filters: this._state.filters,
				sorts: this._state.sorts,
				pagination: {
					page: this._state.currentPage,
					limit: this._state.pageSize
				}
			});
			this._state.setData(freshData);
		} catch (error) {
			this._state.setError((error as Error).message);
			throw error;
		} finally {
			this._state.setLoading(false);
		}
	}
	
	// CRUD operations
	
	/**
	 * Create new record
	 */
	async create(data: Partial<T>): Promise<T> {
		if (this._destroyed) {
			throw new Error('Table instance has been destroyed');
		}
		
		try {
			// Optimistic update if enabled
			let optimisticId: string | undefined;
			if (this.config.options?.optimistic) {
				optimisticId = `temp_${Date.now()}`;
				const optimisticRow = { ...data, id: optimisticId } as T;
				this._state.addRow(optimisticRow);
			}
			
			const newRow = await this._adapter.create(data);
			
			// Replace optimistic update with real data
			if (optimisticId) {
				this._state.removeRow(optimisticId);
			}
			
			// Add the real row if not already added by real-time sync
			if (!this._state.hasRow(newRow.id)) {
				this._state.addRow(newRow);
			}
			
			return newRow;
		} catch (error) {
			// Revert optimistic update on error
			if (this.config.options?.optimistic) {
				// Remove any temporary rows that might have been added
				this._state.data.forEach(row => {
					if (row.id.startsWith('temp_')) {
						this._state.removeRow(row.id);
					}
				});
			}
			throw error;
		}
	}
	
	/**
	 * Update existing record
	 */
	async update(id: string, data: Partial<T>): Promise<T> {
		if (this._destroyed) {
			throw new Error('Table instance has been destroyed');
		}
		
		try {
			// Store original data for optimistic rollback
			const originalRow = this._state.getRow(id);
			
			// Optimistic update if enabled
			if (this.config.options?.optimistic && originalRow) {
				const optimisticRow = { ...originalRow, ...data };
				this._state.updateRow(id, optimisticRow);
			}
			
			const updatedRow = await this._adapter.update(id, data);
			
			// Update with real data
			this._state.updateRow(id, updatedRow);
			
			return updatedRow;
		} catch (error) {
			// Revert optimistic update on error
			if (this.config.options?.optimistic) {
				const originalRow = this._state.getRow(id);
				if (originalRow) {
					// This would need to restore original data
					// Implementation depends on how we track original state
				}
			}
			throw error;
		}
	}
	
	/**
	 * Delete record
	 */
	async delete(id: string): Promise<void> {
		if (this._destroyed) {
			throw new Error('Table instance has been destroyed');
		}
		
		// Store original data for optimistic rollback
		let originalRow: T | undefined;
		
		try {
			// Store original data for optimistic rollback
			originalRow = this._state.getRow(id);
			
			// Optimistic delete if enabled
			if (this.config.options?.optimistic) {
				this._state.removeRow(id);
			}
			
			await this._adapter.delete(id);
			
			// Ensure row is removed (in case optimistic updates are disabled)
			if (!this.config.options?.optimistic) {
				this._state.removeRow(id);
			}
		} catch (error) {
			// Revert optimistic delete on error
			if (this.config.options?.optimistic && originalRow) {
				this._state.addRow(originalRow);
			}
			throw error;
		}
	}
	
	// Cell editing methods
	
	/**
	 * Start editing a cell
	 */
	startCellEdit(rowId: string, columnId: string): void {
		if (!this._editingOptions) {
			throw new Error('Editing is not enabled for this table');
		}
		
		// Check if column is editable
		if (this._editingOptions.editableColumns && !this._editingOptions.editableColumns.includes(columnId)) {
			throw new Error(`Column ${columnId} is not editable`);
		}
		
		// Cancel any existing edit
		if (this._editingCell) {
			this.cancelCellEdit();
		}
		
		// Set editing cell
		this._editingCell = `${rowId}:${columnId}`;
		
		// Call editing start handler if provided
		if (this._editingOptions.onCellEditStart) {
			const row = this._state.getRow(rowId);
			if (row) {
				const value = row[columnId as keyof T];
				this._editingOptions.onCellEditStart(rowId, columnId, value);
			}
		}
	}
	
	/**
	 * Save cell edit
	 */
	async saveCellEdit(rowId: string, columnId: string, newValue: any): Promise<void> {
		if (this._editingCell !== `${rowId}:${columnId}`) {
			throw new Error('Cell is not being edited');
		}
		
		if (!this._editingOptions) {
			throw new Error('Editing is not enabled for this table');
		}
		
		try {
			const row = this._state.getRow(rowId);
			if (!row) {
				throw new Error(`Row ${rowId} not found`);
			}
			
			const oldValue = row[columnId as keyof T];
			
			// Skip if value hasn't changed
			if (oldValue === newValue) {
				this.cancelCellEdit();
				return;
			}
			
			// Call editing save handler if provided
			if (this._editingOptions.onCellEditSave) {
				await this._editingOptions.onCellEditSave(rowId, columnId, oldValue, newValue);
			}
			
			// Update the row data using the existing update method
			const updateData = { [columnId]: newValue } as Partial<T>;
			await this.update(rowId, updateData);
			
			// Clear editing state
			this._editingCell = null;
			
		} catch (error) {
			// Call error handler if provided
			if (this._editingOptions.onCellEditError) {
				this._editingOptions.onCellEditError(rowId, columnId, error as Error);
			}
			throw error;
		}
	}
	
	/**
	 * Cancel cell edit
	 */
	cancelCellEdit(): void {
		if (!this._editingCell) return;
		
		const [rowId, columnId] = this._editingCell.split(':');
		
		// Call editing cancel handler if provided
		if (this._editingOptions?.onCellEditCancel) {
			const row = this._state.getRow(rowId);
			if (row) {
				const value = row[columnId as keyof T];
				this._editingOptions.onCellEditCancel(rowId, columnId, value);
			}
		}
		
		// Clear editing state
		this._editingCell = null;
	}
	
	/**
	 * Check if a cell is currently being edited
	 */
	isCellEditing(rowId: string, columnId: string): boolean {
		return this._editingCell === `${rowId}:${columnId}`;
	}
	
	/**
	 * Update editing options
	 */
	setEditingOptions(options: EditingOptions): void {
		this._editingOptions = {
			trigger: 'click',
			autoSave: true,
			saveOnEnter: true,
			cancelOnEscape: true,
			showButtons: false,
			validateOnSave: true,
			...options
		};
	}
	
	/**
	 * Disable editing
	 */
	disableEditing(): void {
		this.cancelCellEdit();
		this._editingOptions = null;
	}
	
	// Selection methods
	
	/**
	 * Select rows by IDs
	 */
	selectRows(ids: string[]): void {
		this._state.selectRows(ids);
	}
	
	/**
	 * Select all rows
	 */
	selectAllRows(): void {
		this._state.selectAll();
	}
	
	/**
	 * Deselect rows by IDs
	 */
	deselectRows(ids: string[]): void {
		ids.forEach(id => this._state.deselectRow(id));
	}
	
	/**
	 * Clear selection
	 */
	clearSelection(): void {
		this._state.clearSelection();
	}
	
	// Pagination methods
	
	/**
	 * Set current page
	 */
	setPage(page: number): void {
		this._state.setPage(page);
	}
	
	/**
	 * Set page size
	 */
	setPageSize(size: number): void {
		this._state.setPageSize(size);
	}
	
	// Filter methods
	
	/**
	 * Apply filter
	 */
	setFilter(filter: TableFilter): void {
		this._state.addFilter(filter);
	}
	
	/**
	 * Clear filters
	 */
	clearFilters(): void {
		this._state.clearFilters();
	}
	
	// Sort methods
	
	/**
	 * Apply sorting
	 */
	setSort(sort: TableSort): void {
		this._state.addSort(sort);
	}
	
	/**
	 * Clear sorting
	 */
	clearSort(): void {
		this._state.clearSorts();
	}
	
	// Utility methods
	
	/**
	 * Get table statistics
	 */
	getStats() {
		return {
			totalRows: this._state.totalItems,
			filteredRows: this._state.filteredData.length,
			selectedRows: this._state.selectedRows.size,
			currentPage: this._state.currentPage,
			totalPages: this._state.totalPages,
			loading: this._state.loading,
			connected: this._state.connected,
			error: this._state.error
		};
	}
	
	/**
	 * Export current data
	 */
	export(format: 'json' | 'csv' = 'json') {
		const data = this._state.filteredData;
		
		if (format === 'csv') {
			// Simple CSV export (can be enhanced)
			const headers = Object.keys(data[0] || {});
			const csvContent = [
				headers.join(','),
				...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
			].join('\\n');
			
			return csvContent;
		}
		
		return JSON.stringify(data, null, 2);
	}
	
	/**
	 * Destroy table instance and cleanup
	 */
	destroy(): void {
		if (this._destroyed) return;
		
		this._destroyed = true;
		
		// Cleanup subscriptions
		if (this._unsubscribeAdapter) {
			this._unsubscribeAdapter();
		}
		
		// Disconnect adapter
		this._adapter.disconnect().catch(console.error);
		
		// Destroy state
		this._state.destroy();
		
		// Destroy engine
		this._engine.destroy();
	}
}