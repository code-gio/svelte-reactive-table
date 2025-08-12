/**
 * Reactive table state management for svelte-reactive-table
 */

import type { 
	DataRow, 
	TableConfig, 
	TableOptions, 
	TableFilter, 
	TableSort, 
	TableSchema,
	RowState,
	CellPosition,
	VirtualScrollState,
	RenderRange,
	TableStateActions,
	StateChangeEvent,
	StateChangeType,
	StateChanges,
	ReactiveStateStore,
	StatePersistence,
	StateValidator,
	ValidationResult as StateValidationResult,
	ValidationRule as StateValidationRule
} from '../types/core/index.js';

/**
 * Reactive table state implementation using Svelte 5 runes
 */
export class ReactiveTableState<T extends DataRow = DataRow> implements ReactiveTableState<T> {
	// Core data state using $state rune
	data = $state<T[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	connected = $state(false);
	
	// Filter and sort state
	filters = $state<TableFilter[]>([]);
	sorts = $state<TableSort[]>([]);
	
	// Selection state
	selectedRows = $state<Set<string>>(new Set());
	
	// Pagination state
	currentPage = $state(0);
	pageSize = $state(20);
	
	// Edit state
	editingRows = $state<Set<string>>(new Set());
	editingCells = $state<Map<string, string>>(new Map());
	pendingChanges = $state<Map<string, Partial<T>>>(new Map());
	
	// View state
	visibleColumns = $state<Set<string>>(new Set());
	columnOrder = $state<string[]>([]);
	columnWidths = $state<Map<string, number>>(new Map());
	
	// UI state
	focusedCell = $state<CellPosition | null>(null);
	hoveredRow = $state<string | null>(null);
	expandedRows = $state<Set<string>>(new Set());
	
	// Virtual scroll state
	virtualScrollState = $state<VirtualScrollState>({
		containerHeight: 0,
		contentHeight: 0,
		scrollTop: 0,
		rowHeight: 40,
		enabled: false,
		buffer: 5
	});
	
	// Derived state using $derived (private reactive functions)
	private _filteredData = $derived(() => {
		if (this.filters.length === 0) return this.data;
		return this.applyFilters(this.data);
	});
	
	private _sortedData = $derived(() => {
		if (this.sorts.length === 0) return this._filteredData();
		return this.applySorting(this._filteredData());
	});
	
	private _paginatedData = $derived(() => {
		const start = this.currentPage * this.pageSize;
		const end = start + this.pageSize;
		return this._sortedData().slice(start, end);
	});
	
	private _selectedRowsData = $derived(() => {
		return this.data.filter(row => this.selectedRows.has(row.id));
	});
	
	private _allSelected = $derived(() => {
		return this.data.length > 0 && this.selectedRows.size === this.data.length;
	});
	
	private _someSelected = $derived(() => {
		return this.selectedRows.size > 0 && this.selectedRows.size < this.data.length;
	});
	
	private _totalPages = $derived(() => {
		return Math.ceil(this._filteredData().length / this.pageSize);
	});
	
	private _totalItems = $derived(() => {
		return this._filteredData().length;
	});
	
	private _hasNextPage = $derived(() => {
		return this.currentPage < this._totalPages() - 1;
	});
	
	private _hasPreviousPage = $derived(() => {
		return this.currentPage > 0;
	});
	
	private _activeFilters = $derived(() => {
		return this.filters.filter(f => f.value !== null && f.value !== undefined && f.value !== '');
	});
	
	private _filterCount = $derived(() => {
		return this._activeFilters().length;
	});
	
	private _primarySort = $derived(() => {
		return this.sorts.length > 0 ? this.sorts[0] : null;
	});
	
	private _renderRange = $derived(() => {
		const paginatedData = this._paginatedData();
		
		if (!this.virtualScrollState.enabled) {
			return {
				start: 0,
				end: paginatedData.length,
				total: paginatedData.length,
				items: paginatedData.length,
				offsetTop: 0,
				offsetBottom: 0
			};
		}
		
		const { containerHeight, scrollTop, rowHeight, buffer } = this.virtualScrollState;
		const visibleStart = Math.floor(scrollTop / rowHeight);
		const visibleEnd = Math.ceil((scrollTop + containerHeight) / rowHeight);
		
		const start = Math.max(0, visibleStart - buffer);
		const end = Math.min(paginatedData.length, visibleEnd + buffer);
		
		// Update content height as part of derived computation
		const contentHeight = paginatedData.length * rowHeight;
		if (this.virtualScrollState.contentHeight !== contentHeight) {
			// Update content height without triggering loops
			this.virtualScrollState.contentHeight = contentHeight;
		}
		
		return {
			start,
			end,
			total: paginatedData.length,
			items: end - start,
			offsetTop: start * rowHeight,
			offsetBottom: (paginatedData.length - end) * rowHeight
		};
	});
	

	

	

	
	constructor(options: TableOptions) {
		this.pageSize = options.pageSize || 20;
		this.virtualScrollState.enabled = options.virtual || false;
		
		// Setup effects for derived computations
		this.setupEffects();
	}
	
	/**
	 * Setup reactive patterns (avoiding $effect to prevent loops)
	 */
	private setupEffects() {
		// Virtual scroll content height is now computed in the derived state
		// Page reset is handled explicitly when filters are modified
		// This prevents reactive loops while maintaining reactivity
	}
	
	// Data manipulation methods
	
	/**
	 * Set data array
	 */
	setData(newData: T[]): void {
		this.data = [...newData];
	}
	
	/**
	 * Add single row
	 */
	addRow(row: T): void {
		this.data = [...this.data, row];
	}
	
	/**
	 * Add multiple rows
	 */
	addRows(rows: T[]): void {
		this.data = [...this.data, ...rows];
	}
	
	/**
	 * Update row by ID
	 */
	updateRow(id: string, updates: Partial<T>): void {
		const index = this.data.findIndex(row => row.id === id);
		if (index >= 0) {
			const newData = [...this.data];
			newData[index] = { ...newData[index], ...updates };
			this.data = newData;
		}
	}
	
	/**
	 * Remove row by ID
	 */
	removeRow(id: string): void {
		this.data = this.data.filter(row => row.id !== id);
	}
	
	/**
	 * Replace entire data array
	 */
	replaceData(newData: T[]): void {
		this.data = [...newData];
	}
	
	/**
	 * Check if row exists
	 */
	hasRow(id: string): boolean {
		return this.data.some(row => row.id === id);
	}
	
	/**
	 * Get row by ID
	 */
	getRow(id: string): T | undefined {
		return this.data.find(row => row.id === id);
	}
	
	// State setters
	
	setLoading(loading: boolean): void {
		this.loading = loading;
	}
	
	setError(error: string | null): void {
		this.error = error;
	}
	
	setConnected(connected: boolean): void {
		this.connected = connected;
	}
	
	// Selection methods
	
	selectRow(id: string): void {
		const newSelection = new Set(this.selectedRows);
		newSelection.add(id);
		this.selectedRows = newSelection;
	}
	
	deselectRow(id: string): void {
		const newSelection = new Set(this.selectedRows);
		newSelection.delete(id);
		this.selectedRows = newSelection;
	}
	
	selectRows(ids: string[]): void {
		this.selectedRows = new Set(ids);
	}
	
	selectAll(): void {
		this.selectedRows = new Set(this.data.map(row => row.id));
	}
	
	clearSelection(): void {
		this.selectedRows = new Set();
	}
	
	toggleRowSelection(id: string): void {
		if (this.selectedRows.has(id)) {
			this.deselectRow(id);
		} else {
			this.selectRow(id);
		}
	}
	
	// Pagination methods
	
	setPage(page: number): void {
		if (page >= 0 && page < this.totalPages) {
			this.currentPage = page;
		}
	}
	
	setPageSize(size: number): void {
		if (size > 0) {
			this.pageSize = size;
			// Reset to first page when page size changes
			this.currentPage = 0;
		}
	}
	
	nextPage(): void {
		if (this.hasNextPage) {
			this.currentPage++;
		}
	}
	
	previousPage(): void {
		if (this.hasPreviousPage) {
			this.currentPage--;
		}
	}
	
	goToFirstPage(): void {
		this.currentPage = 0;
	}
	
	goToLastPage(): void {
		this.currentPage = Math.max(0, this.totalPages - 1);
	}
	
	// Filter methods
	
	addFilter(filter: TableFilter): void {
		// Remove existing filter for same column
		this.filters = this.filters.filter(f => f.column !== filter.column);
		this.filters = [...this.filters, filter];
		// Reset to first page when filters change
		this.currentPage = 0;
	}
	
	removeFilter(index: number): void {
		this.filters = this.filters.filter((_, i) => i !== index);
		// Reset to first page when filters change
		this.currentPage = 0;
	}
	
	updateFilter(index: number, filter: TableFilter): void {
		const newFilters = [...this.filters];
		if (newFilters[index]) {
			newFilters[index] = filter;
			this.filters = newFilters;
			// Reset to first page when filters change
			this.currentPage = 0;
		}
	}
	
	clearFilters(): void {
		this.filters = [];
		// Reset to first page when filters change
		this.currentPage = 0;
	}
	
	setFilters(newFilters: TableFilter[]): void {
		this.filters = [...newFilters];
		// Reset to first page when filters change
		this.currentPage = 0;
	}
	
	// Sort methods
	
	addSort(sort: TableSort): void {
		// For single column sorting, replace existing
		// For multi-column, would need to handle priority
		this.sorts = [sort];
	}
	
	removeSort(columnId: string): void {
		this.sorts = this.sorts.filter(s => s.column !== columnId);
	}
	
	updateSort(columnId: string, direction: 'asc' | 'desc'): void {
		const existingIndex = this.sorts.findIndex(s => s.column === columnId);
		if (existingIndex >= 0) {
			const newSorts = [...this.sorts];
			newSorts[existingIndex] = { ...newSorts[existingIndex], direction };
			this.sorts = newSorts;
		} else {
			this.addSort({ column: columnId, direction });
		}
	}
	
	clearSorts(): void {
		this.sorts = [];
	}
	
	setSorts(newSorts: TableSort[]): void {
		this.sorts = [...newSorts];
	}
	
	// Virtual scroll methods
	
	updateVirtualScroll(updates: Partial<VirtualScrollState>): void {
		this.virtualScrollState = { ...this.virtualScrollState, ...updates };
	}
	
	updateRenderRange(range: RenderRange): void {
		// This is computed automatically via $derived, but could be useful for manual override
	}
	
	// Data processing methods (private)
	
	private applyFilters(data: T[]): T[] {
		return data.filter(row => {
			return this.filters.every(filter => {
				const cellValue = row[filter.column as keyof T];
				return this.matchesFilter(cellValue, filter);
			});
		});
	}
	
	private matchesFilter(value: any, filter: TableFilter): boolean {
		const { operator, value: filterValue } = filter;
		
		switch (operator) {
			case 'equals':
				return value === filterValue;
			case 'not_equals':
				return value !== filterValue;
			case 'contains':
				return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
			case 'not_contains':
				return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
			case 'starts_with':
				return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
			case 'ends_with':
				return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
			case 'greater_than':
				return Number(value) > Number(filterValue);
			case 'less_than':
				return Number(value) < Number(filterValue);
			case 'greater_equal':
				return Number(value) >= Number(filterValue);
			case 'less_equal':
				return Number(value) <= Number(filterValue);
			case 'in':
				return Array.isArray(filterValue) && filterValue.includes(value);
			case 'not_in':
				return Array.isArray(filterValue) && !filterValue.includes(value);
			case 'is_null':
				return value === null || value === undefined;
			case 'is_not_null':
				return value !== null && value !== undefined;
			default:
				return true;
		}
	}
	
	private applySorting(data: T[]): T[] {
		if (this.sorts.length === 0) return data;
		
		return [...data].sort((a, b) => {
			for (const sort of this.sorts) {
				const aValue = a[sort.column as keyof T];
				const bValue = b[sort.column as keyof T];
				
				let comparison = 0;
				
				if (aValue < bValue) {
					comparison = -1;
				} else if (aValue > bValue) {
					comparison = 1;
				}
				
				if (comparison !== 0) {
					return sort.direction === 'asc' ? comparison : -comparison;
				}
			}
			
			return 0;
		});
	}
	
	// Public getters for interface compatibility
	get filteredData(): T[] {
		return this._filteredData();
	}
	
	get sortedData(): T[] {
		return this._sortedData();
	}
	
	get paginatedData(): T[] {
		return this._paginatedData();
	}
	
	get selectedRowsData(): T[] {
		return this._selectedRowsData();
	}
	
	get allSelected(): boolean {
		return this._allSelected();
	}
	
	get someSelected(): boolean {
		return this._someSelected();
	}
	
	get totalPages(): number {
		return this._totalPages();
	}
	
	get totalItems(): number {
		return this._totalItems();
	}
	
	get hasNextPage(): boolean {
		return this._hasNextPage();
	}
	
	get hasPreviousPage(): boolean {
		return this._hasPreviousPage();
	}
	
	get activeFilters(): TableFilter[] {
		return this._activeFilters();
	}
	
	get filterCount(): number {
		return this._filterCount();
	}
	
	get primarySort(): TableSort | null {
		return this._primarySort();
	}
	
	get renderRange(): RenderRange {
		return this._renderRange();
	}
	
	/**
	 * Get public state (for external consumption)
	 */
	getPublicState() {
		return {
			// Core state
			data: this.data,
			loading: this.loading,
			error: this.error,
			connected: this.connected,
			
			// Derived state
			filteredData: this.filteredData,
			sortedData: this.sortedData,
			paginatedData: this.paginatedData,
			
			// Selection state
			selectedRows: this.selectedRows,
			selectedRowsData: this.selectedRowsData,
			allSelected: this.allSelected,
			someSelected: this.someSelected,
			
			// Pagination state
			currentPage: this.currentPage,
			pageSize: this.pageSize,
			totalPages: this.totalPages,
			totalItems: this.totalItems,
			hasNextPage: this.hasNextPage,
			hasPreviousPage: this.hasPreviousPage,
			
			// Filter state
			filters: this.filters,
			activeFilters: this.activeFilters,
			filterCount: this.filterCount,
			
			// Sort state
			sorts: this.sorts,
			primarySort: this.primarySort,
			
			// Edit state
			editingRows: this.editingRows,
			editingCells: this.editingCells,
			pendingChanges: this.pendingChanges,
			
			// View state
			visibleColumns: this.visibleColumns,
			columnOrder: this.columnOrder,
			columnWidths: this.columnWidths,
			
			// UI state
			focusedCell: this.focusedCell,
			hoveredRow: this.hoveredRow,
			expandedRows: this.expandedRows,
			
			// Performance state
			virtualScrollState: this.virtualScrollState,
			renderRange: this.renderRange
		};
	}
	
	/**
	 * Destroy state and cleanup
	 */
	destroy(): void {
		// Reset all state
		this.data = [];
		this.selectedRows.clear();
		this.filters = [];
		this.sorts = [];
		this.editingRows.clear();
		this.editingCells.clear();
		this.pendingChanges.clear();
		this.visibleColumns.clear();
		this.columnOrder = [];
		this.columnWidths.clear();
		this.expandedRows.clear();
	}
}