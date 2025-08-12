/**
 * Schema and validation type definitions for svelte-reactive-table
 */

import type { DataType, FormatOptions, ValidationRule, CellValue } from './DataTypes.js';

/**
 * Table schema definition
 */
export interface TableSchema<T = any> {
	/** Schema columns */
	columns: ColumnDefinition<T>[];
	
	/** Primary key column(s) */
	primaryKey?: string | string[];
	
	/** Schema metadata */
	meta?: SchemaMeta;
	
	/** Schema validation rules */
	validation?: SchemaValidation;
	
	/** Schema relationships */
	relationships?: SchemaRelationship[];
	
	/** Schema indexes for performance */
	indexes?: SchemaIndex[];
}

/**
 * Column definition interface
 */
export interface ColumnDefinition<T = any> {
	/** Unique column identifier */
	id: keyof T;
	
	/** Column display header */
	header: string;
	
	/** Data type */
	type: DataType;
	
	/** Column width */
	width?: string | number;
	
	/** Minimum column width */
	minWidth?: string | number;
	
	/** Maximum column width */
	maxWidth?: string | number;
	
	/** Is column resizable */
	resizable?: boolean;
	
	/** Is column sortable */
	sortable?: boolean;
	
	/** Is column filterable */
	filterable?: boolean;
	
	/** Is column visible */
	visible?: boolean;
	
	/** Column order/position */
	order?: number;
	
	/** Is column pinned */
	pinned?: ColumnPin;
	
	/** Column alignment */
	align?: 'left' | 'center' | 'right';
	
	/** Format options */
	format?: FormatOptions;
	
	/** Custom formatter function */
	formatter?: (value: any, row: T) => string;
	
	/** Number precision for numeric types */
	precision?: number;
	
	/** Cell click handler */
	onClick?: (value: any, row: T, column: ColumnDefinition<T>) => void;
	
	/** Whether to truncate cell content */
	truncate?: boolean;
	
	/** Validation rules */
	validation?: ValidationRule[];
	
	/** Default value */
	defaultValue?: CellValue;
	
	/** Is column required */
	required?: boolean;
	
	/** Is column readonly */
	readonly?: boolean;
	
	/** Is column editable */
	editable?: boolean;
	
	/** Column description/tooltip */
	description?: string;
	
	/** Custom cell renderer */
	cellRenderer?: CellRenderer<T>;
	
	/** Custom header renderer */
	headerRenderer?: HeaderRenderer;
	
	/** Custom editor component */
	editor?: EditorComponent<T>;
	
	/** Column-specific options */
	options?: ColumnOptions;
	
	/** Column metadata */
	meta?: ColumnMeta;
}

/**
 * Column pinning options
 */
export type ColumnPin = 'left' | 'right' | false;

/**
 * Cell renderer interface
 */
export interface CellRenderer<T = any> {
	/** Component to render */
	component: any; // Svelte component
	
	/** Props to pass to component */
	props?: (row: T, column: ColumnDefinition<T>) => Record<string, any>;
	
	/** Should component handle editing */
	handleEditing?: boolean;
}

/**
 * Header renderer interface
 */
export interface HeaderRenderer {
	/** Component to render */
	component: any; // Svelte component
	
	/** Props to pass to component */
	props?: (column: ColumnDefinition) => Record<string, any>;
}

/**
 * Editor component interface
 */
export interface EditorComponent<T = any> {
	/** Component to render */
	component: any; // Svelte component
	
	/** Props to pass to component */
	props?: (row: T, column: ColumnDefinition<T>) => Record<string, any>;
	
	/** Validation function */
	validate?: (value: CellValue) => boolean | string;
}

/**
 * Column options for specific data types
 */
export interface ColumnOptions {
	/** Select/dropdown options */
	selectOptions?: SelectOption[];
	
	/** Multiple selection allowed */
	multiple?: boolean;
	
	/** Search/filter options */
	searchable?: boolean;
	
	/** Allow custom values */
	allowCustom?: boolean;
	
	/** Number input options */
	step?: number;
	
	/** Date picker options */
	dateOptions?: DateOptions;
	
	/** Text input options */
	textOptions?: TextOptions;
	
	/** File upload options */
	fileOptions?: FileOptions;
}

/**
 * Select option interface
 */
export interface SelectOption {
	/** Option value */
	value: any;
	
	/** Option label */
	label: string;
	
	/** Option description */
	description?: string;
	
	/** Is option disabled */
	disabled?: boolean;
	
	/** Option group */
	group?: string;
	
	/** Option metadata */
	meta?: Record<string, any>;
}

/**
 * Date picker options
 */
export interface DateOptions {
	/** Minimum date */
	min?: Date | string;
	
	/** Maximum date */
	max?: Date | string;
	
	/** Disabled dates */
	disabledDates?: Date[] | string[];
	
	/** Include time picker */
	includeTime?: boolean;
	
	/** Date format */
	format?: string;
	
	/** First day of week (0 = Sunday) */
	firstDayOfWeek?: number;
}

/**
 * Text input options
 */
export interface TextOptions {
	/** Placeholder text */
	placeholder?: string;
	
	/** Maximum length */
	maxLength?: number;
	
	/** Minimum length */
	minLength?: number;
	
	/** Input mask */
	mask?: string;
	
	/** Multiline text area */
	multiline?: boolean;
	
	/** Number of rows for textarea */
	rows?: number;
	
	/** Auto-resize textarea */
	autoResize?: boolean;
}

/**
 * File upload options
 */
export interface FileOptions {
	/** Accepted file types */
	accept?: string[];
	
	/** Multiple files allowed */
	multiple?: boolean;
	
	/** Maximum file size in bytes */
	maxSize?: number;
	
	/** Maximum number of files */
	maxFiles?: number;
	
	/** Upload endpoint */
	uploadEndpoint?: string;
	
	/** Show preview */
	showPreview?: boolean;
}

/**
 * Column metadata
 */
export interface ColumnMeta {
	/** Database column name (if different from ID) */
	dbColumn?: string;
	
	/** Column tags/categories */
	tags?: string[];
	
	/** Column visibility rules */
	visibilityRules?: VisibilityRule[];
	
	/** Column permissions */
	permissions?: ColumnPermissions;
	
	/** Custom column attributes */
	attributes?: Record<string, any>;
	
	/** Column help text */
	help?: string;
	
	/** Column icon */
	icon?: string;
}

/**
 * Visibility rule interface
 */
export interface VisibilityRule {
	/** Rule condition */
	condition: string;
	
	/** Rule parameters */
	params?: Record<string, any>;
	
	/** Show or hide when condition is met */
	action: 'show' | 'hide';
}

/**
 * Column permissions
 */
export interface ColumnPermissions {
	/** Can view column */
	read?: boolean;
	
	/** Can edit column */
	write?: boolean;
	
	/** Required roles to view */
	readRoles?: string[];
	
	/** Required roles to edit */
	writeRoles?: string[];
}

/**
 * Schema metadata
 */
export interface SchemaMeta {
	/** Schema name */
	name?: string;
	
	/** Schema version */
	version?: string;
	
	/** Schema description */
	description?: string;
	
	/** Schema creation date */
	createdAt?: Date;
	
	/** Schema update date */
	updatedAt?: Date;
	
	/** Schema author */
	author?: string;
	
	/** Schema tags */
	tags?: string[];
	
	/** Custom schema attributes */
	attributes?: Record<string, any>;
}

/**
 * Schema validation rules
 */
export interface SchemaValidation {
	/** Cross-field validation rules */
	crossField?: CrossFieldValidation[];
	
	/** Row-level validation */
	rowValidation?: RowValidation[];
	
	/** Unique constraints */
	unique?: UniqueConstraint[];
	
	/** Custom validation functions */
	custom?: CustomValidation[];
}

/**
 * Cross-field validation
 */
export interface CrossFieldValidation {
	/** Fields involved in validation */
	fields: string[];
	
	/** Validation function */
	validator: (values: Record<string, any>) => boolean | string;
	
	/** Error message */
	message: string;
	
	/** Validation name */
	name?: string;
}

/**
 * Row validation
 */
export interface RowValidation {
	/** Validation function */
	validator: (row: any) => boolean | string;
	
	/** Error message */
	message: string;
	
	/** Validation name */
	name?: string;
	
	/** Validation priority */
	priority?: number;
}

/**
 * Unique constraint
 */
export interface UniqueConstraint {
	/** Fields that must be unique together */
	fields: string[];
	
	/** Constraint name */
	name?: string;
	
	/** Error message */
	message?: string;
}

/**
 * Custom validation function
 */
export interface CustomValidation {
	/** Validation function */
	validator: (data: any[], schema: TableSchema) => ValidationResult[];
	
	/** Validation name */
	name: string;
	
	/** Run on every change */
	onEveryChange?: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
	/** Is validation valid */
	valid: boolean;
	
	/** Error message */
	message?: string;
	
	/** Field that failed validation */
	field?: string;
	
	/** Row index that failed */
	rowIndex?: number;
	
	/** Validation type */
	type?: string;
}

/**
 * Schema relationship definition
 */
export interface SchemaRelationship {
	/** Relationship type */
	type: 'one_to_one' | 'one_to_many' | 'many_to_many';
	
	/** Related table/collection */
	relatedTable: string;
	
	/** Local field */
	localField: string;
	
	/** Foreign field */
	foreignField: string;
	
	/** Relationship name */
	name?: string;
	
	/** Should load related data */
	autoLoad?: boolean;
	
	/** Related data display field */
	displayField?: string;
}

/**
 * Schema index definition
 */
export interface SchemaIndex {
	/** Fields to index */
	fields: string[];
	
	/** Index type */
	type?: 'btree' | 'hash' | 'fulltext' | 'spatial';
	
	/** Is index unique */
	unique?: boolean;
	
	/** Index name */
	name?: string;
	
	/** Index options */
	options?: Record<string, any>;
}