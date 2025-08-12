/**
 * State management type definitions for svelte-reactive-table
 * Using Svelte 5 runes for reactive state
 */

import type { DataRow, DataChangeEvent, RowState } from './DataTypes.js';
import type { TableFilter, TableSort } from './TableTypes.js';

/**
 * Main table state using Svelte 5 runes
 */
export interface ReactiveTableState<T extends DataRow = DataRow> {
	// Core data state
	data: T[];
	loading: boolean;
	error: string | null;
	connected: boolean;
	
	// Derived state
	filteredData: T[];
	sortedData: T[];
	paginatedData: T[];
	
	// Selection state
	selectedRows: Set<string>;
	selectedRowsData: T[];
	allSelected: boolean;
	someSelected: boolean;
	
	// Pagination state
	currentPage: number;
	pageSize: number;
	totalPages: number;
	totalItems: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	
	// Filter state
	filters: TableFilter[];
	activeFilters: TableFilter[];
	filterCount: number;
	
	// Sort state
	sorts: TableSort[];
	primarySort: TableSort | null;
	
	// Edit state
	editingRows: Set<string>;
	editingCells: Map<string, string>; // rowId -> columnId
	pendingChanges: Map<string, Partial<T>>;
	
	// View state
	visibleColumns: Set<string>;
	columnOrder: string[];
	columnWidths: Map<string, number>;
	
	// UI state
	focusedCell: CellPosition | null;
	hoveredRow: string | null;
	expandedRows: Set<string>;
	
	// Performance state
	virtualScrollState: VirtualScrollState;
	renderRange: RenderRange;
}

/**
 * Cell position interface
 */
export interface CellPosition {
	/** Row ID */
	rowId: string;
	
	/** Column ID */
	columnId: string;
	
	/** Row index in current view */
	rowIndex: number;
	
	/** Column index */
	columnIndex: number;
}

/**
 * Virtual scroll state
 */
export interface VirtualScrollState {
	/** Container height */
	containerHeight: number;
	
	/** Total content height */
	contentHeight: number;
	
	/** Current scroll position */
	scrollTop: number;
	
	/** Row height (fixed or estimated) */
	rowHeight: number;
	
	/** Is virtual scrolling enabled */
	enabled: boolean;
	
	/** Buffer size (rows to render outside viewport) */
	buffer: number;
}

/**
 * Render range for virtualization
 */
export interface RenderRange {
	/** Start index (inclusive) */
	start: number;
	
	/** End index (exclusive) */
	end: number;
	
	/** Total number of items */
	total: number;
	
	/** Items to render */
	items: number;
	
	/** Offset from top */
	offsetTop: number;
	
	/** Offset from bottom */
	offsetBottom: number;
}

/**
 * Table state actions interface
 */
export interface TableStateActions<T extends DataRow = DataRow> {
	// Data actions
	setData(data: T[]): void;
	updateRow(id: string, updates: Partial<T>): void;
	addRow(row: T): void;
	removeRow(id: string): void;
	replaceData(data: T[]): void;
	
	// Loading actions
	setLoading(loading: boolean): void;
	setError(error: string | null): void;
	setConnected(connected: boolean): void;
	
	// Selection actions
	selectRow(id: string): void;
	deselectRow(id: string): void;
	selectRows(ids: string[]): void;
	selectAll(): void;
	clearSelection(): void;
	toggleRowSelection(id: string): void;
	
	// Pagination actions
	setPage(page: number): void;
	setPageSize(size: number): void;
	nextPage(): void;
	previousPage(): void;
	goToFirstPage(): void;
	goToLastPage(): void;
	
	// Filter actions
	addFilter(filter: TableFilter): void;
	removeFilter(index: number): void;
	updateFilter(index: number, filter: TableFilter): void;
	clearFilters(): void;
	setFilters(filters: TableFilter[]): void;
	
	// Sort actions
	addSort(sort: TableSort): void;
	removeSort(columnId: string): void;
	updateSort(columnId: string, direction: 'asc' | 'desc'): void;
	clearSorts(): void;
	setSorts(sorts: TableSort[]): void;
	
	// Edit actions
	startEditing(rowId: string, columnId?: string): void;
	stopEditing(rowId: string, columnId?: string): void;
	cancelEditing(rowId: string): void;
	savePendingChanges(rowId: string): Promise<void>;
	setPendingChange(rowId: string, columnId: string, value: any): void;
	
	// View actions
	showColumn(columnId: string): void;
	hideColumn(columnId: string): void;
	setColumnOrder(order: string[]): void;
	setColumnWidth(columnId: string, width: number): void;
	resetColumnWidths(): void;
	
	// Focus actions
	setFocusedCell(position: CellPosition | null): void;
	setHoveredRow(rowId: string | null): void;
	expandRow(rowId: string): void;
	collapseRow(rowId: string): void;
	toggleRowExpansion(rowId: string): void;
	
	// Virtual scroll actions
	updateVirtualScroll(state: Partial<VirtualScrollState>): void;
	updateRenderRange(range: RenderRange): void;
}

/**
 * State change event interface
 */
export interface StateChangeEvent<T extends DataRow = DataRow> {
	/** Event type */
	type: StateChangeType;
	
	/** Previous state */
	previousState: Partial<ReactiveTableState<T>>;
	
	/** Current state */
	currentState: Partial<ReactiveTableState<T>>;
	
	/** Changes made */
	changes: StateChanges;
	
	/** Event timestamp */
	timestamp: Date;
	
	/** Event source */
	source: 'user' | 'system' | 'sync';
}

/**
 * State change types
 */
export type StateChangeType = 
	| 'data_change'
	| 'selection_change' 
	| 'pagination_change'
	| 'filter_change'
	| 'sort_change'
	| 'edit_change'
	| 'view_change'
	| 'focus_change'
	| 'virtual_scroll_change';

/**
 * State changes detail
 */
export interface StateChanges {
	/** Fields that changed */
	fields: string[];
	
	/** Added items */
	added?: any[];
	
	/** Removed items */
	removed?: any[];
	
	/** Modified items */
	modified?: any[];
	
	/** Change metadata */
	meta?: Record<string, any>;
}

/**
 * State store interface for Svelte 5 runes
 */
export interface ReactiveStateStore<T extends DataRow = DataRow> {
	/** Get current state (reactive) */
	readonly state: ReactiveTableState<T>;
	
	/** State actions */
	readonly actions: TableStateActions<T>;
	
	/** Subscribe to state changes */
	subscribe(callback: (event: StateChangeEvent<T>) => void): () => void;
	
	/** Get state snapshot (non-reactive) */
	getSnapshot(): ReactiveTableState<T>;
	
	/** Reset state to initial values */
	reset(): void;
	
	/** Destroy store and cleanup */
	destroy(): void;
}

/**
 * State persistence interface
 */
export interface StatePersistence<T extends DataRow = DataRow> {
	/** Save state to storage */
	save(state: Partial<ReactiveTableState<T>>): Promise<void>;
	
	/** Load state from storage */
	load(): Promise<Partial<ReactiveTableState<T>> | null>;
	
	/** Clear persisted state */
	clear(): Promise<void>;
	
	/** Get storage key */
	getKey(): string;
}

/**
 * State validation interface
 */
export interface StateValidator<T extends DataRow = DataRow> {
	/** Validate state */
	validate(state: Partial<ReactiveTableState<T>>): ValidationResult[];
	
	/** Validate specific field */
	validateField(field: string, value: any): ValidationResult[];
	
	/** Get validation rules */
	getRules(): ValidationRule[];
}

/**
 * State validation result
 */
export interface ValidationResult {
	/** Is valid */
	valid: boolean;
	
	/** Error message */
	message?: string;
	
	/** Field that failed */
	field?: string;
	
	/** Validation rule that failed */
	rule?: string;
}

/**
 * State validation rule
 */
export interface ValidationRule {
	/** Field to validate */
	field: string;
	
	/** Validation function */
	validator: (value: any, state: ReactiveTableState) => boolean | string;
	
	/** Error message */
	message: string;
	
	/** Rule name */
	name?: string;
}

/**
 * Real-time synchronization types
 */

/** Conflict resolution strategies */
export type ConflictResolutionStrategy = 
	| 'last-write-wins'
	| 'first-write-wins' 
	| 'manual'
	| 'merge';

/** Optimistic update interface */
export interface OptimisticUpdate<T extends DataRow = DataRow> {
	/** Unique update ID */
	id: string;
	
	/** Update type */
	type: 'create' | 'update' | 'delete';
	
	/** Data being updated */
	data: T;
	
	/** Original data (for rollback) */
	originalData?: T;
	
	/** Timestamp when update was created */
	timestamp: Date;
	
	/** Status of the update */
	status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflicted';
	
	/** Retry count */
	retryCount: number;
	
	/** Error message if failed */
	error?: string;
}

/** Real-time sync event interface */
export interface RealtimeSyncEvent<T extends DataRow = DataRow> {
	/** Event type */
	type: 'sync_start' | 'sync_complete' | 'sync_error' | 'conflict_detected' | 'connection_change';
	
	/** Event data */
	data?: any;
	
	/** Update that caused the event */
	update?: OptimisticUpdate<T>;
	
	/** Error if applicable */
	error?: string;
	
	/** Timestamp */
	timestamp: Date;
}

/** Connection state types */
export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting' | 'error';

/** Sync status types */
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'conflicted';