/**
 * Core table interfaces and types for svelte-reactive-table
 * Uses Svelte 5 runes for reactive state management
 */

import type { TableSchema } from './SchemaTypes.js';

/**
 * Main table configuration interface
 */
export interface TableConfig<T = any> {
	/** Unique identifier for the table instance */
	id: string;
	
	/** Database adapter for data operations */
	adapter: any; // BaseAdapter<T> - will be properly typed when BaseAdapter is imported
	
	/** Table schema definition */
	schema: TableSchema<T>;
	
	/** Optional table configuration */
	options?: TableOptions;
}

/**
 * Table configuration options
 */
export interface TableOptions {
	/** Enable real-time synchronization */
	realtime?: boolean;
	
	/** Enable optimistic updates */
	optimistic?: boolean;
	
	/** Enable virtual scrolling for performance */
	virtual?: boolean;
	
	/** Page size for pagination */
	pageSize?: number;
	
	/** Enable sorting */
	sortable?: boolean;
	
	/** Enable filtering */
	filterable?: boolean;
	
	/** Enable column resizing */
	resizable?: boolean;
	
	/** Enable row selection */
	selectable?: boolean;
	
	/** Enable multi-select mode */
	multiSelect?: boolean;
	
	/** Selection mode */
	selectionMode?: 'single' | 'multiple';
	
	/** Row click handler */
	onRowClick?: (row: any, event: MouseEvent) => void;
	
	/** Row double-click handler */
	onRowDoubleClick?: (row: any, event: MouseEvent) => void;
	
	/** Custom empty state message */
	emptyMessage?: string;
	
	/** Enable inline editing */
	editable?: boolean;
	
	/** Custom CSS class for styling */
	className?: string;
	
	/** Accessibility options */
	accessibility?: AccessibilityOptions;
}

/**
 * Accessibility configuration
 */
export interface AccessibilityOptions {
	/** ARIA label for the table */
	ariaLabel?: string;
	
	/** ARIA description for the table */
	ariaDescription?: string;
	
	/** Enable keyboard navigation */
	keyboardNavigation?: boolean;
	
	/** Enable screen reader support */
	screenReader?: boolean;
	
	/** Custom ARIA attributes */
	customAria?: Record<string, string>;
}

/**
 * Table state interface using Svelte 5 runes
 */
export interface TableState<T = any> {
	/** Raw data from adapter */
	readonly data: T[];
	
	/** Loading state */
	readonly loading: boolean;
	
	/** Error state */
	readonly error: string | null;
	
	/** Connection state */
	readonly connected: boolean;
	
	/** Filtered data */
	readonly filteredData: T[];
	
	/** Sorted data */
	readonly sortedData: T[];
	
	/** Paginated data for current page */
	readonly paginatedData: T[];
	
	/** Selected rows */
	readonly selectedRows: Set<string>;
	
	/** Current page number */
	readonly currentPage: number;
	
	/** Total number of pages */
	readonly totalPages: number;
	
	/** Total number of items */
	readonly totalItems: number;
}

/**
 * Table instance interface
 */
export interface ReactiveTableInstance<T = any> {
	/** Table configuration */
	readonly config: TableConfig<T>;
	
	/** Current table state */
	readonly state: TableState<T>;
	
	/** Connect to data source */
	connect(): Promise<void>;
	
	/** Disconnect from data source */
	disconnect(): Promise<void>;
	
	/** Refresh data */
	refresh(): Promise<void>;
	
	/** Create new record */
	create(data: Partial<T>): Promise<T>;
	
	/** Update existing record */
	update(id: string, data: Partial<T>): Promise<T>;
	
	/** Delete record */
	delete(id: string): Promise<void>;
	
	/** Select rows */
	selectRows(ids: string[]): void;
	
	/** Clear selection */
	clearSelection(): void;
	
	/** Set current page */
	setPage(page: number): void;
	
	/** Set page size */
	setPageSize(size: number): void;
	
	/** Apply filter */
	setFilter(filter: TableFilter): void;
	
	/** Clear filters */
	clearFilters(): void;
	
	/** Apply sorting */
	setSort(sort: TableSort): void;
	
	/** Clear sorting */
	clearSort(): void;
	
	/** Destroy table instance */
	destroy(): void;
}

/**
 * Table filter configuration
 */
export interface TableFilter {
	/** Column to filter */
	column: string;
	
	/** Filter operator */
	operator: FilterOperator;
	
	/** Filter value */
	value: any;
	
	/** Filter type */
	type?: FilterType;
}

/**
 * Filter operators
 */
export type FilterOperator = 
	| 'equals' 
	| 'not_equals'
	| 'contains' 
	| 'not_contains'
	| 'starts_with' 
	| 'ends_with'
	| 'greater_than' 
	| 'less_than'
	| 'greater_equal' 
	| 'less_equal'
	| 'in' 
	| 'not_in'
	| 'is_null' 
	| 'is_not_null';

/**
 * Filter types
 */
export type FilterType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multi_select';

/**
 * Table sorting configuration
 */
export interface TableSort {
	/** Column to sort by */
	column: string;
	
	/** Sort direction */
	direction: SortDirection;
	
	/** Sort priority for multi-column sorting */
	priority?: number;
}

/**
 * Sort directions
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Table events interface
 */
export interface TableEvents<T = any> {
	/** Fired when data changes */
	dataChange: { data: T[] };
	
	/** Fired when loading state changes */
	loadingChange: { loading: boolean };
	
	/** Fired when error occurs */
	error: { error: string };
	
	/** Fired when connection state changes */
	connectionChange: { connected: boolean };
	
	/** Fired when row is selected */
	rowSelect: { row: T; selected: boolean };
	
	/** Fired when selection changes */
	selectionChange: { selectedRows: Set<string> };
	
	/** Fired when page changes */
	pageChange: { page: number };
	
	/** Fired when filters change */
	filterChange: { filters: TableFilter[] };
	
	/** Fired when sorting changes */
	sortChange: { sorts: TableSort[] };
	
	/** Fired when row is created */
	rowCreate: { row: T };
	
	/** Fired when row is updated */
	rowUpdate: { row: T; changes: Partial<T> };
	
	/** Fired when row is deleted */
	rowDelete: { id: string };
}

/**
 * Table component props interface
 */
export interface TableProps<T = any> {
	/** Table configuration */
	config: TableConfig<T>;
	
	/** Optional CSS class */
	class?: string;
	
	/** Optional custom styles */
	style?: string;
}