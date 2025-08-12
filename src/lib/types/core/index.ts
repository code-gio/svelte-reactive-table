/**
 * Core type definitions exports for svelte-reactive-table
 */

// Table types
export type {
	TableConfig,
	TableOptions,
	AccessibilityOptions,
	TableState,
	ReactiveTableInstance,
	TableFilter,
	FilterOperator,
	FilterType,
	TableSort,
	SortDirection,
	TableEvents,
	TableProps
} from './TableTypes.js';

// Data types  
export type {
	DataRow,
	CellValue,
	CellData,
	CellMeta,
	CellFlags,
	CellStyle,
	DataType,
	FormatOptions,
	ValidationRule,
	ValidationType,
	RowState,
	RowFlags,
	RowMeta,
	DataChangeEvent,
	DataTransform
} from './DataTypes.js';

// Schema types
export type {
	TableSchema,
	ColumnDefinition,
	ColumnPin,
	CellRenderer,
	HeaderRenderer,
	EditorComponent,
	ColumnOptions,
	SelectOption,
	DateOptions,
	TextOptions,
	FileOptions,
	ColumnMeta,
	VisibilityRule,
	ColumnPermissions,
	SchemaMeta,
	SchemaValidation,
	CrossFieldValidation,
	RowValidation,
	UniqueConstraint,
	CustomValidation,
	ValidationResult,
	SchemaRelationship,
	SchemaIndex
} from './SchemaTypes.js';

// State types
export type {
	ReactiveTableState,
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
} from './StateTypes.js';