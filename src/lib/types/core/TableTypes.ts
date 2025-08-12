/**
 * Core table interfaces and types for svelte-reactive-table
 * Uses Svelte 5 runes for reactive state management
 */

import type { TableSchema } from './SchemaTypes.js';
import type { AdapterConfig } from '../adapters/AdapterTypes.js';
import type { BaseAdapter } from '../../adapters/base/BaseAdapter.js';
import type { DataRow } from './DataTypes.js';

/**
 * Main table configuration interface
 */
export interface TableConfig<T extends DataRow = DataRow> {
	/** Unique identifier for the table instance */
	id: string;
	
	/** Database adapter for data operations */
	adapter: BaseAdapter<T> | AdapterConfig;
	
	/** Table schema definition */
	schema: TableSchema<T>;
	
	/** Optional table configuration */
	options?: TableOptions;
	
	/** Initial data for memory adapters */
	initialData?: T[];
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
	
	/** Editing configuration */
	editing?: EditingOptions;
	
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
export interface ReactiveTableInstance<T extends DataRow = DataRow> {
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
	| 'notEquals'
	| 'contains' 
	| 'notContains'
	| 'startsWith' 
	| 'endsWith'
	| 'greaterThan' 
	| 'lessThan'
	| 'greaterThanOrEqual' 
	| 'lessThanOrEqual'
	| 'in' 
	| 'notIn'
	| 'between'
	| 'isNull' 
	| 'isNotNull'
	| 'isEmpty'
	| 'isNotEmpty'
	| 'regex';

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
 * Cell editing configuration
 */
export interface EditingOptions {
	/** How to trigger cell editing */
	trigger?: 'click' | 'doubleclick' | 'focus';
	
	/** Which columns are editable (if not specified, all columns are editable) */
	editableColumns?: string[];
	
	/** Auto-save on blur */
	autoSave?: boolean;
	
	/** Save on Enter key */
	saveOnEnter?: boolean;
	
	/** Cancel on Escape key */
	cancelOnEscape?: boolean;
	
	/** Show save/cancel buttons */
	showButtons?: boolean;
	
	/** Validate on save */
	validateOnSave?: boolean;
	
	/** Cell edit event handlers */
	onCellEditStart?: (rowId: string, columnId: string, value: any) => void;
	onCellEditSave?: (rowId: string, columnId: string, oldValue: any, newValue: any) => void | Promise<void>;
	onCellEditCancel?: (rowId: string, columnId: string, value: any) => void;
	onCellEditError?: (rowId: string, columnId: string, error: Error) => void;
}

/**
 * Table events interface
 */
export interface TableEvents<T extends DataRow = DataRow> {
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
export interface TableProps<T extends DataRow = DataRow> {
	/** Table configuration */
	config: TableConfig<T>;
	
	/** Optional CSS class */
	class?: string;
	
	/** Optional custom styles */
	style?: string;
}