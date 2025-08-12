/**
 * Data row and cell type definitions for svelte-reactive-table
 */

/**
 * Base data row interface - all data rows must have an ID
 */
export interface DataRow {
	/** Unique identifier for the row */
	id: string;
	
	/** Additional data properties */
	[key: string]: any;
}

/**
 * Cell value types
 */
export type CellValue = 
	| string 
	| number 
	| boolean 
	| Date 
	| null 
	| undefined
	| Record<string, any>
	| CellValue[];

/**
 * Cell data interface
 */
export interface CellData {
	/** Cell value */
	value: CellValue;
	
	/** Original value (for editing) */
	originalValue?: CellValue;
	
	/** Cell metadata */
	meta?: CellMeta;
	
	/** Display value (formatted) */
	displayValue?: string;
	
	/** Validation errors */
	errors?: string[];
	
	/** Cell state flags */
	flags?: CellFlags;
}

/**
 * Cell metadata
 */
export interface CellMeta {
	/** Data type */
	type?: DataType;
	
	/** Format options */
	format?: FormatOptions;
	
	/** Validation rules */
	validation?: ValidationRule[];
	
	/** Custom attributes */
	attributes?: Record<string, any>;
	
	/** Cell styling */
	style?: CellStyle;
}

/**
 * Cell state flags
 */
export interface CellFlags {
	/** Is cell being edited */
	editing?: boolean;
	
	/** Is cell selected */
	selected?: boolean;
	
	/** Has cell been modified */
	modified?: boolean;
	
	/** Is cell invalid */
	invalid?: boolean;
	
	/** Is cell required */
	required?: boolean;
	
	/** Is cell readonly */
	readonly?: boolean;
	
	/** Is cell disabled */
	disabled?: boolean;
	
	/** Is cell loading */
	loading?: boolean;
}

/**
 * Cell styling options
 */
export interface CellStyle {
	/** Background color */
	backgroundColor?: string;
	
	/** Text color */
	color?: string;
	
	/** Font weight */
	fontWeight?: string;
	
	/** Font style */
	fontStyle?: string;
	
	/** Text alignment */
	textAlign?: 'left' | 'center' | 'right';
	
	/** Custom CSS class */
	className?: string;
	
	/** Custom CSS properties */
	custom?: Record<string, string>;
}

/**
 * Data types supported by the table
 */
export type DataType = 
	| 'string'
	| 'text'
	| 'number'
	| 'integer'
	| 'float'
	| 'boolean'
	| 'date'
	| 'datetime'
	| 'time'
	| 'email'
	| 'url'
	| 'phone'
	| 'json'
	| 'array'
	| 'object'
	| 'enum'
	| 'uuid'
	| 'currency'
	| 'percentage';

/**
 * Format options for different data types
 */
export interface FormatOptions {
	/** Date format */
	dateFormat?: string;
	
	/** Number format */
	numberFormat?: Intl.NumberFormatOptions;
	
	/** Currency code */
	currency?: string;
	
	/** Locale for formatting */
	locale?: string;
	
	/** Custom formatter function */
	formatter?: (value: any) => string;
	
	/** Decimal places */
	decimals?: number;
	
	/** Show thousands separator */
	thousands?: boolean;
	
	/** Boolean display values */
	booleanDisplay?: { true: string; false: string };
	
	/** Enum value mapping */
	enumMapping?: Record<string, string>;
	
	/** Truncate text length */
	truncate?: number;
	
	/** Show ellipsis for truncated text */
	ellipsis?: boolean;
}

/**
 * Validation rule interface
 */
export interface ValidationRule {
	/** Rule type */
	type: ValidationType;
	
	/** Rule parameters */
	params?: any;
	
	/** Error message */
	message?: string;
	
	/** Custom validation function */
	validator?: (value: any) => boolean | string;
}

/**
 * Validation types
 */
export type ValidationType = 
	| 'required'
	| 'min_length'
	| 'max_length'
	| 'min_value'
	| 'max_value'
	| 'pattern'
	| 'email'
	| 'url'
	| 'integer'
	| 'float'
	| 'date'
	| 'custom';

/**
 * Row state interface
 */
export interface RowState {
	/** Row data */
	data: DataRow;
	
	/** Row index in dataset */
	index: number;
	
	/** Is row selected */
	selected: boolean;
	
	/** Is row being edited */
	editing: boolean;
	
	/** Is row expanded (for nested data) */
	expanded: boolean;
	
	/** Row validation errors */
	errors: string[];
	
	/** Row flags */
	flags: RowFlags;
	
	/** Row metadata */
	meta?: RowMeta;
}

/**
 * Row flags
 */
export interface RowFlags {
	/** Is row new (not yet saved) */
	new?: boolean;
	
	/** Is row modified */
	modified?: boolean;
	
	/** Is row being deleted */
	deleting?: boolean;
	
	/** Is row readonly */
	readonly?: boolean;
	
	/** Is row disabled */
	disabled?: boolean;
	
	/** Is row loading */
	loading?: boolean;
	
	/** Is row invalid */
	invalid?: boolean;
	
	/** Is row pinned */
	pinned?: boolean;
	
	/** Is row highlighted */
	highlighted?: boolean;
}

/**
 * Row metadata
 */
export interface RowMeta {
	/** Original row data (for change tracking) */
	original?: DataRow;
	
	/** Row creation timestamp */
	createdAt?: Date;
	
	/** Row update timestamp */
	updatedAt?: Date;
	
	/** Row version (for optimistic updates) */
	version?: number;
	
	/** Custom row attributes */
	attributes?: Record<string, any>;
	
	/** Row styling */
	style?: CellStyle;
	
	/** Nested children (for tree-like data) */
	children?: DataRow[];
	
	/** Parent row ID (for hierarchical data) */
	parentId?: string;
}

/**
 * Data change event interface
 */
export interface DataChangeEvent<T = DataRow> {
	/** Change type */
	type: 'create' | 'update' | 'delete' | 'bulk_update' | 'bulk_delete';
	
	/** Affected rows */
	rows: T[];
	
	/** Data for single row changes (for backward compatibility) */
	data?: T;
	
	/** Changes made (for updates) */
	changes?: Partial<T>[];
	
	/** Change source */
	source: 'user' | 'sync' | 'system';
	
	/** Timestamp of change */
	timestamp: Date;
	
	/** Transaction ID (for grouping related changes) */
	transactionId?: string;
}

/**
 * Data transformation interface
 */
export interface DataTransform<T = DataRow> {
	/** Transform function */
	transform: (data: T[]) => T[];
	
	/** Transform name */
	name: string;
	
	/** Transform priority */
	priority: number;
	
	/** Enable/disable transform */
	enabled: boolean;
}