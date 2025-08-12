/**
 * Table engine for processing and manipulating data in svelte-reactive-table
 */

import type { DataRow, TableSchema } from '../types/core/index.js';
import type { ReactiveTableState } from './TableState.svelte.js';

/**
 * Table processing engine for data transformations and validation
 */
export class TableEngine<T extends DataRow = DataRow> {
	private state: ReactiveTableState<T>;
	private schema: TableSchema<T>;
	
	// Processing state using runes
	private processingQueue = $state<ProcessingTask[]>([]);
	private isProcessing = $state(false);
	
	// Processing statistics
	private stats = $state({
		totalProcessed: 0,
		lastProcessingTime: 0,
		averageProcessingTime: 0,
		errorsCount: 0
	});
	
	constructor(state: ReactiveTableState<T>, schema: TableSchema<T>) {
		this.state = state;
		this.schema = schema;
		
		this.setupProcessingEffects();
	}
	
	/**
	 * Setup processing patterns (avoiding $effect to prevent loops)
	 */
	private setupProcessingEffects() {
		// Instead of reactive effects, we'll use explicit processing calls
		// This prevents infinite loops and gives better control over when processing occurs
		
		// Processing will be triggered explicitly by:
		// 1. Data changes (called from ReactiveTable when data is set)
		// 2. Manual validation requests
		// 3. Schema updates
	}
	
	/**
	 * Trigger processing when data changes (called explicitly)
	 */
	triggerDataValidation(): void {
		if (!this.isProcessing) {
			this.queueProcessing('data_validation');
			this.processQueueIfReady();
		}
	}
	
	/**
	 * Process queue if ready (non-reactive)
	 */
	private processQueueIfReady(): void {
		if (this.processingQueue.length > 0 && !this.isProcessing) {
			// Process asynchronously to avoid blocking
			setTimeout(() => this.processQueue(), 0);
		}
	}
	
	/**
	 * Process data through the engine pipeline
	 */
	async processData(): Promise<void> {
		const startTime = performance.now();
		this.isProcessing = true;
		
		try {
			// 1. Validate data structure
			await this.validateDataStructure();
			
			// 2. Apply schema validation
			await this.applySchemaValidation();
			
			// 3. Transform data if needed
			await this.transformData();
			
			// 4. Calculate derived values
			await this.calculateDerivedValues();
			
			// Update stats
			const processingTime = performance.now() - startTime;
			this.updateProcessingStats(processingTime);
			
		} catch (error) {
			console.error('Data processing error:', error);
			this.stats.errorsCount++;
		} finally {
			this.isProcessing = false;
		}
	}
	
	/**
	 * Queue a processing task
	 */
	private queueProcessing(type: ProcessingTaskType, priority: number = 0): void {
		const task: ProcessingTask = {
			id: this.generateTaskId(),
			type,
			priority,
			timestamp: new Date()
		};
		
		this.processingQueue = [...this.processingQueue, task].sort((a, b) => b.priority - a.priority);
	}
	
	/**
	 * Process the task queue
	 */
	private async processQueue(): Promise<void> {
		if (this.processingQueue.length === 0) return;
		
		const task = this.processingQueue[0];
		this.processingQueue = this.processingQueue.slice(1);
		
		await this.processTask(task);
	}
	
	/**
	 * Process individual task
	 */
	private async processTask(task: ProcessingTask): Promise<void> {
		switch (task.type) {
			case 'data_validation':
				await this.validateDataStructure();
				break;
			case 'schema_validation':
				await this.applySchemaValidation();
				break;
			case 'data_transformation':
				await this.transformData();
				break;
			case 'derived_calculation':
				await this.calculateDerivedValues();
				break;
		}
	}
	
	/**
	 * Validate data structure
	 */
	private async validateDataStructure(): Promise<void> {
		const data = this.state.data;
		
		for (let i = 0; i < data.length; i++) {
			const row = data[i];
			
			// Check required ID field
			if (!row.id) {
				throw new Error(`Row at index ${i} is missing required 'id' field`);
			}
			
			// Check for duplicate IDs
			const duplicateIndex = data.findIndex((otherRow, otherIndex) => 
				otherIndex !== i && otherRow.id === row.id
			);
			
			if (duplicateIndex !== -1) {
				throw new Error(`Duplicate ID '${row.id}' found at indices ${i} and ${duplicateIndex}`);
			}
		}
	}
	
	/**
	 * Apply schema validation
	 */
	private async applySchemaValidation(): Promise<void> {
		const data = this.state.data;
		const columns = this.schema.columns;
		
		for (const row of data) {
			for (const column of columns) {
				const value = row[column.id as keyof T];
				
				// Required field validation
				if (column.required && (value === null || value === undefined || value === '')) {
					console.warn(`Required field '${String(column.id)}' is empty in row ${row.id}`);
				}
				
				// Type validation
				if (value !== null && value !== undefined) {
					this.validateFieldType(value, column.type, String(column.id), row.id);
				}
				
				// Custom validation rules
				if (column.validation) {
					for (const rule of column.validation) {
						const isValid = await this.validateRule(value, rule);
						if (!isValid) {
							console.warn(`Validation failed for field '${String(column.id)}' in row ${row.id}: ${rule.message || 'Validation error'}`);
						}
					}
				}
			}
		}
		
		// Schema-level validation
		if (this.schema.validation) {
			await this.applySchemaLevelValidation();
		}
	}
	
	/**
	 * Validate field type
	 */
	private validateFieldType(value: any, expectedType: string, fieldName: string, rowId: string): void {
		let isValid = true;
		
		switch (expectedType) {
			case 'text':
				isValid = typeof value === 'string';
				break;
			case 'number':
			case 'integer':
			case 'float':
				isValid = typeof value === 'number' && !isNaN(value);
				if (expectedType === 'integer') {
					isValid = isValid && Number.isInteger(value);
				}
				break;
			case 'boolean':
				isValid = typeof value === 'boolean';
				break;
			case 'date':
			case 'datetime':
				isValid = value instanceof Date || !isNaN(Date.parse(value));
				break;
			case 'email':
				isValid = typeof value === 'string' && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);
				break;
			case 'url':
				try {
					new URL(value);
					isValid = true;
				} catch {
					isValid = false;
				}
				break;
		}
		
		if (!isValid) {
			console.warn(`Type mismatch for field '${fieldName}' in row ${rowId}. Expected ${expectedType}, got ${typeof value}`);
		}
	}
	
	/**
	 * Validate individual rule
	 */
	private async validateRule(value: any, rule: any): Promise<boolean> {
		switch (rule.type) {
			case 'required':
				return value !== null && value !== undefined && value !== '';
			case 'min_length':
				return typeof value === 'string' && value.length >= rule.params;
			case 'max_length':
				return typeof value === 'string' && value.length <= rule.params;
			case 'min_value':
				return typeof value === 'number' && value >= rule.params;
			case 'max_value':
				return typeof value === 'number' && value <= rule.params;
			case 'pattern':
				return typeof value === 'string' && new RegExp(rule.params).test(value);
			case 'custom':
				return rule.validator ? rule.validator(value) : true;
			default:
				return true;
		}
	}
	
	/**
	 * Apply schema-level validation
	 */
	private async applySchemaLevelValidation(): Promise<void> {
		const validation = this.schema.validation;
		const data = this.state.data;
		
		// Cross-field validation
		if (validation?.crossField) {
			for (const crossFieldRule of validation.crossField) {
				for (const row of data) {
					const fieldValues: Record<string, any> = {};
					for (const field of crossFieldRule.fields) {
						fieldValues[field] = row[field as keyof T];
					}
					
					const isValid = crossFieldRule.validator(fieldValues);
					if (!isValid) {
						console.warn(`Cross-field validation failed for row ${row.id}: ${crossFieldRule.message}`);
					}
				}
			}
		}
		
		// Row-level validation
		if (validation?.rowValidation) {
			for (const rowRule of validation.rowValidation) {
				for (const row of data) {
					const isValid = rowRule.validator(row);
					if (!isValid) {
						console.warn(`Row validation failed for row ${row.id}: ${rowRule.message}`);
					}
				}
			}
		}
		
		// Unique constraints
		if (validation?.unique) {
			for (const constraint of validation.unique) {
				const valueGroups = new Map<string, string[]>();
				
				for (const row of data) {
					const key = constraint.fields.map(field => row[field as keyof T]).join('|');
					if (!valueGroups.has(key)) {
						valueGroups.set(key, []);
					}
					valueGroups.get(key)!.push(row.id);
				}
				
				for (const [key, rowIds] of valueGroups) {
					if (rowIds.length > 1) {
						console.warn(`Unique constraint violation for fields [${constraint.fields.join(', ')}]: ${constraint.message || 'Values must be unique'}`);
					}
				}
			}
		}
	}
	
	/**
	 * Transform data according to schema
	 */
	private async transformData(): Promise<void> {
		// Apply data transformations if defined
		// This could include format conversions, normalization, etc.
		
		const data = this.state.data;
		const columns = this.schema.columns;
		
		for (let i = 0; i < data.length; i++) {
			const row = { ...data[i] };
			let hasChanges = false;
			
			for (const column of columns) {
				const value = row[column.id as keyof T];
				
				if (value !== null && value !== undefined && column.format) {
					const transformedValue = this.transformValue(value, column.format);
					if (transformedValue !== value) {
						(row as any)[column.id] = transformedValue;
						hasChanges = true;
					}
				}
			}
			
			if (hasChanges) {
				// Update the specific row in state
				this.state.updateRow(row.id, row);
			}
		}
	}
	
	/**
	 * Transform individual value
	 */
	private transformValue(value: any, format: any): any {
		// Apply formatters if available
		if (format.formatter) {
			try {
				return format.formatter(value);
			} catch (error) {
				console.warn('Formatter error:', error);
				return value;
			}
		}
		
		// Apply built-in transformations
		if (format.truncate && typeof value === 'string') {
			return value.length > format.truncate 
				? value.substring(0, format.truncate) + (format.ellipsis ? '...' : '')
				: value;
		}
		
		return value;
	}
	
	/**
	 * Calculate derived values
	 */
	private async calculateDerivedValues(): Promise<void> {
		// Calculate any derived/computed columns
		// This would be based on schema definitions for computed fields
	}
	
	/**
	 * Update processing statistics
	 */
	private updateProcessingStats(processingTime: number): void {
		this.stats.totalProcessed++;
		this.stats.lastProcessingTime = processingTime;
		
		// Calculate running average
		const weight = 0.1; // Weight for exponential moving average
		this.stats.averageProcessingTime = 
			this.stats.averageProcessingTime * (1 - weight) + processingTime * weight;
	}
	
	/**
	 * Generate unique task ID
	 */
	private generateTaskId(): string {
		return `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
	}
	
	/**
	 * Get processing statistics
	 */
	getStats() {
		return {
			...this.stats,
			isProcessing: this.isProcessing,
			queueLength: this.processingQueue.length
		};
	}
	
	/**
	 * Destroy engine and cleanup
	 */
	destroy(): void {
		this.processingQueue = [];
		this.isProcessing = false;
	}
}

/**
 * Processing task interface
 */
interface ProcessingTask {
	id: string;
	type: ProcessingTaskType;
	priority: number;
	timestamp: Date;
}

/**
 * Processing task types
 */
type ProcessingTaskType = 
	| 'data_validation'
	| 'schema_validation' 
	| 'data_transformation'
	| 'derived_calculation';