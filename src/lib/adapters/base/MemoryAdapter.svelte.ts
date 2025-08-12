/**
 * In-memory adapter implementation for svelte-reactive-table
 * Used for demos and testing
 */

import { BaseAdapter } from './BaseAdapter.js';
import type { 
	AdapterConfig, 
	ReadOptions, 
	CountOptions,
	RealtimeSubscription
} from '../../types/adapters/index.js';
import type { DataRow, DataChangeEvent } from '../../types/core/index.js';

/**
 * In-memory adapter for demo and testing purposes
 */
export class MemoryAdapter<T extends DataRow = DataRow> extends BaseAdapter<T> {
	private data: T[] = [];
	private listeners: Set<(event: DataChangeEvent<T>) => void> = new Set();
	
	constructor(config: AdapterConfig, initialData: T[] = []) {
		super(config);
		this.data = [...initialData];
	}
	

	
	/**
	 * Connect to data source (no-op for memory adapter)
	 */
	async connect(): Promise<void> {
		this.state.setConnected(true);
		this.state.setLoading(false);
	}
	
	/**
	 * Disconnect from data source (no-op for memory adapter)
	 */
	async disconnect(): Promise<void> {
		this.state.setConnected(false);
		this.state.setLoading(false);
	}
	
	/**
	 * Create a new record
	 */
	async create(data: Partial<T>): Promise<T> {
		this.state.incrementPendingOperations();
		
		try {
			const newRecord = {
				...data,
				id: this.generateId()
			} as T;
			
			this.data.push(newRecord);
			this.notifyListeners({ 
				type: 'create', 
				rows: [newRecord],
				source: 'system',
				timestamp: new Date()
			});
			
			return newRecord;
		} catch (error) {
			this.handleError(error as Error, 'create');
			throw error;
		} finally {
			this.state.decrementPendingOperations();
		}
	}
	
	/**
	 * Read records
	 */
	async read(options?: ReadOptions): Promise<T[]> {
		this.state.incrementPendingOperations();
		
		try {
			let result = [...this.data];
			
			// Apply filters if provided
			if (options?.filters) {
				result = this.applyFilters(result, options.filters);
			}
			
			// Apply sorting if provided
			if (options?.sorts && options.sorts.length > 0) {
				result = this.applySorting(result, options.sorts[0]);
			}
			
			// Apply pagination if provided
			if (options?.pagination) {
				const { page = 1, limit = 10 } = options.pagination;
				const start = (page - 1) * limit;
				const end = start + limit;
				result = result.slice(start, end);
			}
			
			return result;
		} catch (error) {
			this.handleError(error as Error, 'read');
			throw error;
		} finally {
			this.state.decrementPendingOperations();
		}
	}
	
	/**
	 * Update an existing record
	 */
	async update(id: string, data: Partial<T>): Promise<T> {
		this.state.incrementPendingOperations();
		
		try {
			const index = this.data.findIndex(item => item.id === id);
			if (index === -1) {
				throw new Error(`Record with id ${id} not found`);
			}
			
			const updatedRecord = { ...this.data[index], ...data } as T;
			this.data[index] = updatedRecord;
			
			this.notifyListeners({ 
				type: 'update', 
				rows: [updatedRecord],
				source: 'system',
				timestamp: new Date()
			});
			
			return updatedRecord;
		} catch (error) {
			this.handleError(error as Error, 'update');
			throw error;
		} finally {
			this.state.decrementPendingOperations();
		}
	}
	
	/**
	 * Delete a record
	 */
	async delete(id: string): Promise<void> {
		this.state.incrementPendingOperations();
		
		try {
			const index = this.data.findIndex(item => item.id === id);
			if (index === -1) {
				throw new Error(`Record with id ${id} not found`);
			}
			
			const deletedRecord = this.data[index];
			this.data.splice(index, 1);
			
			this.notifyListeners({ 
				type: 'delete', 
				rows: [deletedRecord],
				source: 'system',
				timestamp: new Date()
			});
		} catch (error) {
			this.handleError(error as Error, 'delete');
			throw error;
		} finally {
			this.state.decrementPendingOperations();
		}
	}
	
	/**
	 * Count records
	 */
	async count(options?: CountOptions): Promise<number> {
		try {
			let result = [...this.data];
			
			// Apply filters if provided
			if (options?.filters) {
				result = this.applyFilters(result, options.filters);
			}
			
			return result.length;
		} catch (error) {
			this.handleError(error as Error, 'count');
			throw error;
		}
	}
	
	/**
	 * Subscribe to data changes
	 */
	subscribe(callback: (event: DataChangeEvent<T>) => void): () => void {
		this.listeners.add(callback);
		
		return () => {
			this.listeners.delete(callback);
		};
	}
	
	/**
	 * Set initial data
	 */
	setData(data: T[]): void {
		this.data = [...data];
		this.notifyListeners({ 
			type: 'bulk_update', 
			rows: this.data,
			source: 'system',
			timestamp: new Date()
		});
	}
	
	/**
	 * Get all data
	 */
	getAllData(): T[] {
		return [...this.data];
	}
	
	/**
	 * Clear all data
	 */
	clear(): void {
		this.data = [];
		this.notifyListeners({ 
			type: 'bulk_update', 
			rows: [],
			source: 'system',
			timestamp: new Date()
		});
	}
	
	/**
	 * Notify listeners of data changes
	 */
	private notifyListeners(event: DataChangeEvent<T>): void {
		this.listeners.forEach(listener => {
			try {
				listener(event);
			} catch (error) {
				console.error('Error in adapter listener:', error);
			}
		});
	}
	
	/**
	 * Apply filters to data
	 */
	private applyFilters(data: T[], filters: any[]): T[] {
		return data.filter(item => {
			return filters.every(filter => {
				const value = item[filter.column as keyof T];
				
				switch (filter.operator) {
					case 'equals':
						return value === filter.value;
					case 'not_equals':
						return value !== filter.value;
					case 'contains':
						return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
					case 'not_contains':
						return !String(value).toLowerCase().includes(String(filter.value).toLowerCase());
					case 'starts_with':
						return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
					case 'ends_with':
						return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
					case 'greater_than':
						return Number(value) > Number(filter.value);
					case 'less_than':
						return Number(value) < Number(filter.value);
					case 'greater_equal':
						return Number(value) >= Number(filter.value);
					case 'less_equal':
						return Number(value) <= Number(filter.value);
					case 'in':
						return Array.isArray(filter.value) && filter.value.includes(value);
					case 'not_in':
						return Array.isArray(filter.value) && !filter.value.includes(value);
					case 'is_null':
						return value == null;
					case 'is_not_null':
						return value != null;
					default:
						return true;
				}
			});
		});
	}
	
	/**
	 * Apply sorting to data
	 */
	private applySorting(data: T[], sort: any): T[] {
		return [...data].sort((a, b) => {
			const aValue = a[sort.column as keyof T];
			const bValue = b[sort.column as keyof T];
			
			let comparison = 0;
			
			if (typeof aValue === 'string' && typeof bValue === 'string') {
				comparison = aValue.localeCompare(bValue);
			} else if (typeof aValue === 'number' && typeof bValue === 'number') {
				comparison = aValue - bValue;
			} else {
				comparison = String(aValue).localeCompare(String(bValue));
			}
			
			return sort.direction === 'desc' ? -comparison : comparison;
		});
	}
}
