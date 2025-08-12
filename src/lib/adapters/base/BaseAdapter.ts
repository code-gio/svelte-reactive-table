/**
 * Base adapter implementation for svelte-reactive-table
 */

import { ReactiveAdapterState } from './AdapterState.svelte.js';
import type { 
	AdapterConfig, 
	CRUDOperations, 
	ReadOptions, 
	CountOptions,
	RealtimeSubscription,
	SubscriptionConfig
} from '../../types/adapters/index.js';
import type { DataRow, DataChangeEvent } from '../../types/core/index.js';

/**
 * Abstract base adapter class
 * All database adapters must extend this class
 */
export abstract class BaseAdapter<T extends DataRow = DataRow> implements CRUDOperations<T> {
	protected config: AdapterConfig;
	protected state: ReactiveAdapterState;
	protected subscriptions = new Map<string, RealtimeSubscription<T>>();
	protected cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
	
	constructor(config: AdapterConfig) {
		this.config = config;
		this.state = new ReactiveAdapterState();
		
		// Set up cache cleaning interval if caching is enabled
		if (config.options?.cache?.enabled) {
			this.setupCacheCleanup();
		}
	}
	
	/**
	 * Get adapter ID
	 */
	getId(): string {
		return this.generateId();
	}
	
	/**
	 * Get adapter state
	 */
	getState(): ReactiveAdapterState {
		return this.state;
	}
	
	/**
	 * Get adapter configuration
	 */
	getConfig(): AdapterConfig {
		return { ...this.config };
	}
	
	// Methods that each adapter should implement (default implementations provided)
	
	/**
	 * Connect to the data source
	 */
	async connect(): Promise<void> {
		throw new Error('connect() method must be implemented by adapter');
	}
	
	/**
	 * Disconnect from the data source
	 */
	async disconnect(): Promise<void> {
		throw new Error('disconnect() method must be implemented by adapter');
	}
	
	/**
	 * Check if adapter is connected
	 */
	isConnected(): boolean {
		return this.state.connected;
	}
	
	/**
	 * Get adapter type
	 */
	getType(): string {
		return this.config.type;
	}
	
	// CRUD Operations (default implementations provided)
	
	async create(_data: Partial<T>): Promise<T> {
		throw new Error('create() method must be implemented by adapter');
	}
	
	async read(_options?: ReadOptions): Promise<T[]> {
		throw new Error('read() method must be implemented by adapter');
	}
	
	async update(_id: string, _data: Partial<T>): Promise<T> {
		throw new Error('update() method must be implemented by adapter');
	}
	
	async delete(_id: string): Promise<void> {
		throw new Error('delete() method must be implemented by adapter');
	}
	
	async count(_options?: CountOptions): Promise<number> {
		throw new Error('count() method must be implemented by adapter');
	}
	
	/**
	 * Bulk create records
	 * Default implementation using individual creates
	 */
	async bulkCreate(data: Partial<T>[]): Promise<T[]> {
		this.state.setLoading(true);
		this.state.incrementPendingOperations();
		
		try {
			const results: T[] = [];
			
			for (const item of data) {
				const result = await this.create(item);
				results.push(result);
			}
			
			return results;
		} catch (error) {
			this.handleError(error as Error, 'bulk_create');
			throw error;
		} finally {
			this.state.setLoading(false);
			this.state.decrementPendingOperations();
		}
	}
	
	/**
	 * Bulk update records
	 * Default implementation using individual updates
	 */
	async bulkUpdate(updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]> {
		this.state.setLoading(true);
		this.state.incrementPendingOperations();
		
		try {
			const results: T[] = [];
			
			for (const { id, data } of updates) {
				const result = await this.update(id, data);
				results.push(result);
			}
			
			return results;
		} catch (error) {
			this.handleError(error as Error, 'bulk_update');
			throw error;
		} finally {
			this.state.setLoading(false);
			this.state.decrementPendingOperations();
		}
	}
	
	/**
	 * Bulk delete records
	 * Default implementation using individual deletes
	 */
	async bulkDelete(ids: string[]): Promise<void> {
		this.state.setLoading(true);
		this.state.incrementPendingOperations();
		
		try {
			for (const id of ids) {
				await this.delete(id);
			}
		} catch (error) {
			this.handleError(error as Error, 'bulk_delete');
			throw error;
		} finally {
			this.state.setLoading(false);
			this.state.decrementPendingOperations();
		}
	}
	
	/**
	 * Check if record exists
	 */
	async exists(id: string): Promise<boolean> {
		try {
			const count = await this.count({
				filters: [{ column: 'id', operator: 'equals', value: id }]
			});
			return count > 0;
		} catch {
			return false;
		}
	}
	
	// Real-time subscription methods
	
	/**
	 * Subscribe to data changes
	 * Default implementation (no real-time support)
	 */
	subscribe(_callback: (event: DataChangeEvent<T>) => void): () => void {
		// Default implementation - no real-time support
		console.warn('Real-time subscriptions not supported by this adapter');
		return () => {};
	}
	
	/**
	 * Subscribe to specific collection/table changes
	 */
	subscribeToCollection(
		path: string,
		_callback: (event: DataChangeEvent<T>) => void,
		options?: SubscriptionConfig
	): RealtimeSubscription<T> {
		const subscription: RealtimeSubscription<T> = {
			subscribe: (_cb) => {
				// Store callback for this subscription
				return () => {};
			},
			isSubscribed: () => true,
			getConfig: () => options || {},
			updateFilters: () => {},
			pause: () => {},
			resume: () => {},
			unsubscribe: () => {
				this.subscriptions.delete(path);
			}
		};
		
		this.subscriptions.set(path, subscription);
		return subscription;
	}
	
	/**
	 * Unsubscribe from collection changes
	 */
	unsubscribeFromCollection(path: string): void {
		const subscription = this.subscriptions.get(path);
		if (subscription) {
			subscription.unsubscribe();
			this.subscriptions.delete(path);
		}
	}
	
	// Cache methods
	
	/**
	 * Get data from cache
	 */
	protected getCached<R = any>(key: string): R | null {
		if (!this.config.options?.cache?.enabled) {
			return null;
		}
		
		const cached = this.cache.get(key);
		if (!cached) {
			return null;
		}
		
		const now = Date.now();
		if (now - cached.timestamp > cached.ttl) {
			this.cache.delete(key);
			return null;
		}
		
		return cached.data;
	}
	
	/**
	 * Store data in cache
	 */
	protected setCached(key: string, data: any, ttl?: number): void {
		if (!this.config.options?.cache?.enabled) {
			return;
		}
		
		const cacheTtl = ttl || this.config.options.cache.ttl || 60000; // Default 1 minute
		
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl: cacheTtl
		});
		
		this.updateCacheStatus();
	}
	
	/**
	 * Clear cache
	 */
	protected clearCache(): void {
		this.cache.clear();
		this.updateCacheStatus();
	}
	
	/**
	 * Update cache status in state
	 */
	private updateCacheStatus(): void {
		this.state.updateCacheStatus({
			enabled: this.config.options?.cache?.enabled || false,
			size: this.cache.size,
			lastUpdate: new Date()
		});
	}
	
	/**
	 * Setup cache cleanup interval
	 */
	private setupCacheCleanup(): void {
		const cleanupInterval = 60000; // Clean every minute
		
		setInterval(() => {
			const now = Date.now();
			for (const [key, cached] of this.cache.entries()) {
				if (now - cached.timestamp > cached.ttl) {
					this.cache.delete(key);
				}
			}
			this.updateCacheStatus();
		}, cleanupInterval);
	}
	
	// Utility methods
	
	/**
	 * Handle errors and update state
	 */
	protected handleError(error: Error, _context?: string): void {
		this.state.setError(error.message);
	}
	
	/**
	 * Generate unique adapter ID
	 */
	private generateId(): string {
		return `${this.config.type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
	}
	
	/**
	 * Generate unique operation ID
	 */
	protected generateOperationId(): string {
		return `op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
	}
	
	/**
	 * Validate configuration
	 */
	protected validateConfig(): void {
		if (!this.config.type) {
			throw new Error('Adapter type is required');
		}
	}
	
	/**
	 * Destroy adapter and cleanup resources
	 */
	destroy(): void {
		// Clear subscriptions
		for (const subscription of this.subscriptions.values()) {
			subscription.unsubscribe();
		}
		this.subscriptions.clear();
		
		// Clear cache
		this.clearCache();
		
		// Reset state
		this.state.reset();
	}
}