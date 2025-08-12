/**
 * Optimistic updates manager using Svelte 5 runes
 * Handles optimistic updates for better user experience
 */

import type { 
	DataRow, 
	DataChangeEvent,
	OptimisticUpdate,
	ConflictResolutionStrategy 
} from '../../types/core/index.js';

export interface OptimisticUpdateConfig {
	/** Enable optimistic updates */
	enabled: boolean;
	
	/** Maximum number of pending updates */
	maxPendingUpdates: number;
	
	/** Timeout for pending updates (ms) */
	timeout: number;
	
	/** Retry failed updates */
	retryFailedUpdates: boolean;
	
	/** Maximum retry attempts */
	maxRetries: number;
	
	/** Delay between retries (ms) */
	retryDelay: number;
	
	/** Conflict resolution strategy */
	conflictResolution: ConflictResolutionStrategy;
}

export interface OptimisticState<T extends DataRow = DataRow> {
	/** Pending optimistic updates */
	pending: OptimisticUpdate<T>[];
	
	/** Failed updates */
	failed: OptimisticUpdate<T>[];
	
	/** Conflicted updates */
	conflicted: OptimisticUpdate<T>[];
	
	/** Successfully synced updates */
	synced: OptimisticUpdate<T>[];
	
	/** Currently syncing updates */
	syncing: Set<string>;
	
	/** Total operations count */
	totalOperations: number;
	
	/** Success rate */
	successRate: number;
	
	/** Average sync time (ms) */
	averageSyncTime: number;
}

/**
 * Optimistic updates manager with Svelte 5 runes
 */
export class OptimisticUpdateManager<T extends DataRow = DataRow> {
	private config: OptimisticUpdateConfig;
	
	// Reactive state using Svelte 5 runes
	public state = $state<OptimisticState<T>>({
		pending: [],
		failed: [],
		conflicted: [],
		synced: [],
		syncing: new Set(),
		totalOperations: 0,
		successRate: 100,
		averageSyncTime: 0
	});
	
	// Private state
	private retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
	private syncTimes = new Map<string, number>();
	
	constructor(config: Partial<OptimisticUpdateConfig> = {}) {
		this.config = {
			enabled: true,
			maxPendingUpdates: 100,
			timeout: 30000,
			retryFailedUpdates: true,
			maxRetries: 3,
			retryDelay: 1000,
			conflictResolution: 'last-write-wins',
			...config
		};
	}
	
	/**
	 * Add optimistic update
	 */
	addUpdate(
		type: 'create' | 'update' | 'delete',
		data: T,
		originalData?: T
	): OptimisticUpdate<T> {
		if (!this.config.enabled) {
			throw new Error('Optimistic updates are disabled');
		}
		
		// Check if we're at the limit
		if (this.state.pending.length >= this.config.maxPendingUpdates) {
			throw new Error('Maximum pending updates reached');
		}
		
		const update: OptimisticUpdate<T> = {
			id: this.generateUpdateId(),
			type,
			data,
			originalData,
			timestamp: new Date(),
			status: 'pending',
			retryCount: 0
		};
		
		// Add to pending updates
		this.state.pending.push(update);
		this.state.totalOperations++;
		
		// Set timeout for update
		this.setUpdateTimeout(update);
		
		return update;
	}
	
	/**
	 * Mark update as syncing
	 */
	markAsSyncing(updateId: string): void {
		const update = this.findUpdate(updateId);
		if (!update) return;
		
		update.status = 'syncing';
		this.state.syncing.add(updateId);
		this.syncTimes.set(updateId, Date.now());
	}
	
	/**
	 * Mark update as synced successfully
	 */
	markAsSynced(updateId: string): void {
		const update = this.findUpdate(updateId);
		if (!update) return;
		
		// Update status
		update.status = 'synced';
		this.state.syncing.delete(updateId);
		
		// Move from pending to synced
		this.moveUpdate(update, 'pending', 'synced');
		
		// Clear timeout
		this.clearUpdateTimeout(updateId);
		
		// Record sync time
		this.recordSyncTime(updateId);
		
		// Update metrics
		this.updateMetrics();
	}
	
	/**
	 * Mark update as failed
	 */
	markAsFailed(updateId: string, error?: string): void {
		const update = this.findUpdate(updateId);
		if (!update) return;
		
		update.status = 'failed';
		update.error = error;
		this.state.syncing.delete(updateId);
		
		// Clear timeout
		this.clearUpdateTimeout(updateId);
		
		// Attempt retry if configured
		if (this.config.retryFailedUpdates && update.retryCount < this.config.maxRetries) {
			this.scheduleRetry(update);
		} else {
			// Move to failed updates
			this.moveUpdate(update, 'pending', 'failed');
		}
		
		// Update metrics
		this.updateMetrics();
	}
	
	/**
	 * Mark update as conflicted
	 */
	markAsConflicted(updateId: string, remoteData?: T): void {
		const update = this.findUpdate(updateId);
		if (!update) return;
		
		update.status = 'conflicted';
		this.state.syncing.delete(updateId);
		
		// Store remote data for conflict resolution
		if (remoteData) {
			(update as any).remoteData = remoteData;
		}
		
		// Move to conflicted updates
		this.moveUpdate(update, 'pending', 'conflicted');
		
		// Clear timeout
		this.clearUpdateTimeout(updateId);
		
		// Update metrics
		this.updateMetrics();
	}
	
	/**
	 * Rollback optimistic update
	 */
	rollbackUpdate(updateId: string): T | null {
		const update = this.findUpdate(updateId);
		if (!update || !update.originalData) return null;
		
		// Remove update from all lists
		this.removeUpdate(updateId);
		
		// Return original data for restoration
		return update.originalData;
	}
	
	/**
	 * Resolve conflict manually
	 */
	resolveConflict(
		updateId: string, 
		resolution: 'local' | 'remote' | 'merged',
		mergedData?: T
	): T {
		const update = this.state.conflicted.find(u => u.id === updateId);
		if (!update) {
			throw new Error('Conflicted update not found');
		}
		
		let resolvedData: T;
		
		switch (resolution) {
			case 'local':
				resolvedData = update.data;
				break;
			case 'remote':
				resolvedData = (update as any).remoteData || update.data;
				break;
			case 'merged':
				if (!mergedData) {
					throw new Error('Merged data is required for merged resolution');
				}
				resolvedData = mergedData;
				break;
			default:
				throw new Error('Invalid resolution type');
		}
		
		// Update the update data and mark as resolved
		update.data = resolvedData;
		update.status = 'pending';
		
		// Move back to pending for sync
		this.moveUpdate(update, 'conflicted', 'pending');
		
		return resolvedData;
	}
	
	/**
	 * Auto-resolve conflicts based on strategy
	 */
	autoResolveConflicts(): void {
		const conflicted = [...this.state.conflicted];
		
		for (const update of conflicted) {
			const remoteData = (update as any).remoteData;
			if (!remoteData) continue;
			
			let resolvedData: T;
			
			switch (this.config.conflictResolution) {
				case 'last-write-wins':
					// Remote wins (more recent)
					resolvedData = remoteData;
					break;
					
				case 'first-write-wins':
					// Local wins (was first)
					resolvedData = update.data;
					break;
					
				case 'merge':
					// Attempt to merge
					resolvedData = this.mergeData(update.data, remoteData);
					break;
					
				default:
					continue; // Skip auto-resolution for manual strategy
			}
			
			this.resolveConflict(update.id, 'merged', resolvedData);
		}
	}
	
	/**
	 * Merge local and remote data
	 */
	private mergeData(localData: T, remoteData: T): T {
		// Simple merge strategy - combine properties
		const merged = { ...remoteData };
		
		// For each property in local data
		for (const [key, localValue] of Object.entries(localData)) {
			if (key === 'id') continue; // Never merge ID
			
			const remoteValue = remoteData[key as keyof T];
			
			// Keep local value if remote doesn't have it or is null/undefined
			if (remoteValue === undefined || remoteValue === null) {
				(merged as any)[key] = localValue;
			}
			// For timestamps, keep the more recent one
			else if (key.includes('updated') || key.includes('modified')) {
				const localTime = new Date(localValue as any).getTime();
				const remoteTime = new Date(remoteValue as any).getTime();
				(merged as any)[key] = localTime > remoteTime ? localValue : remoteValue;
			}
		}
		
		return merged;
	}
	
	/**
	 * Get all updates for a specific record
	 */
	getUpdatesForRecord(id: string | number): OptimisticUpdate<T>[] {
		const recordId = String(id);
		const allUpdates = [
			...this.state.pending,
			...this.state.failed,
			...this.state.conflicted,
			...this.state.syncing
		];
		
		return allUpdates.filter(update => String(update.data.id) === recordId);
	}
	
	/**
	 * Check if record has pending changes
	 */
	hasPendingChanges(id: string | number): boolean {
		const recordId = String(id);
		return this.state.pending.some(update => String(update.data.id) === recordId);
	}
	
	/**
	 * Get pending changes for a record
	 */
	getPendingChanges(id: string | number): Partial<T> | null {
		const recordId = String(id);
		const pendingUpdate = this.state.pending
			.filter(update => String(update.data.id) === recordId)
			.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
		
		if (!pendingUpdate || !pendingUpdate.originalData) return null;
		
		// Calculate diff between original and updated data
		const changes: Partial<T> = {};
		for (const [key, value] of Object.entries(pendingUpdate.data)) {
			const originalValue = pendingUpdate.originalData[key as keyof T];
			if (originalValue !== value) {
				(changes as any)[key] = value;
			}
		}
		
		return changes;
	}
	
	/**
	 * Clear all updates
	 */
	clearAll(): void {
		// Clear all timers
		for (const timer of this.retryTimers.values()) {
			clearTimeout(timer);
		}
		this.retryTimers.clear();
		this.syncTimes.clear();
		
		// Reset state
		this.state.pending = [];
		this.state.failed = [];
		this.state.conflicted = [];
		this.state.synced = [];
		this.state.syncing.clear();
	}
	
	/**
	 * Clear synced updates (for cleanup)
	 */
	clearSynced(): void {
		this.state.synced = [];
	}
	
	/**
	 * Private helper methods
	 */
	
	private generateUpdateId(): string {
		return `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}
	
	private findUpdate(updateId: string): OptimisticUpdate<T> | undefined {
		return this.state.pending.find(u => u.id === updateId) ||
		       this.state.failed.find(u => u.id === updateId) ||
		       this.state.conflicted.find(u => u.id === updateId) ||
		       this.state.synced.find(u => u.id === updateId);
	}
	
	private moveUpdate(
		update: OptimisticUpdate<T>, 
		from: keyof OptimisticState<T>, 
		to: keyof OptimisticState<T>
	): void {
		// Remove from source array
		const fromArray = this.state[from] as OptimisticUpdate<T>[];
		const index = fromArray.findIndex(u => u.id === update.id);
		if (index !== -1) {
			fromArray.splice(index, 1);
		}
		
		// Add to target array
		const toArray = this.state[to] as OptimisticUpdate<T>[];
		toArray.push(update);
	}
	
	private removeUpdate(updateId: string): void {
		// Remove from all arrays
		this.state.pending = this.state.pending.filter(u => u.id !== updateId);
		this.state.failed = this.state.failed.filter(u => u.id !== updateId);
		this.state.conflicted = this.state.conflicted.filter(u => u.id !== updateId);
		this.state.synced = this.state.synced.filter(u => u.id !== updateId);
		this.state.syncing.delete(updateId);
		
		// Clear timers
		this.clearUpdateTimeout(updateId);
		this.syncTimes.delete(updateId);
	}
	
	private setUpdateTimeout(update: OptimisticUpdate<T>): void {
		const timer = setTimeout(() => {
			this.markAsFailed(update.id, 'Update timeout');
		}, this.config.timeout);
		
		this.retryTimers.set(update.id, timer);
	}
	
	private clearUpdateTimeout(updateId: string): void {
		const timer = this.retryTimers.get(updateId);
		if (timer) {
			clearTimeout(timer);
			this.retryTimers.delete(updateId);
		}
	}
	
	private scheduleRetry(update: OptimisticUpdate<T>): void {
		update.retryCount++;
		
		const delay = this.config.retryDelay * Math.pow(2, update.retryCount - 1); // Exponential backoff
		
		const timer = setTimeout(() => {
			// Move back to pending and reset status
			update.status = 'pending';
			update.error = undefined;
			
			// Set new timeout
			this.setUpdateTimeout(update);
		}, delay);
		
		this.retryTimers.set(update.id, timer);
	}
	
	private recordSyncTime(updateId: string): void {
		const startTime = this.syncTimes.get(updateId);
		if (startTime) {
			const syncTime = Date.now() - startTime;
			this.syncTimes.delete(updateId);
			
			// Update average sync time
			const syncTimes = Array.from(this.syncTimes.values());
			if (syncTimes.length > 0) {
				this.state.averageSyncTime = syncTimes.reduce((a, b) => a + b, 0) / syncTimes.length;
			}
		}
	}
	
	private updateMetrics(): void {
		const total = this.state.totalOperations;
		const successful = this.state.synced.length;
		
		if (total > 0) {
			this.state.successRate = (successful / total) * 100;
		}
	}
	
	/**
	 * Get performance metrics
	 */
	getMetrics(): {
		totalOperations: number;
		pendingCount: number;
		failedCount: number;
		conflictedCount: number;
		successRate: number;
		averageSyncTime: number;
		memoryUsage: number;
	} {
		const totalUpdates = this.state.pending.length + 
			this.state.failed.length + 
			this.state.conflicted.length + 
			this.state.synced.length;
		
		return {
			totalOperations: this.state.totalOperations,
			pendingCount: this.state.pending.length,
			failedCount: this.state.failed.length,
			conflictedCount: this.state.conflicted.length,
			successRate: this.state.successRate,
			averageSyncTime: this.state.averageSyncTime,
			memoryUsage: totalUpdates * 256 // Rough estimate in bytes
		};
	}
	
	/**
	 * Get state snapshot for debugging
	 */
	getStateSnapshot(): OptimisticState<T> {
		return {
			pending: [...this.state.pending],
			failed: [...this.state.failed],
			conflicted: [...this.state.conflicted],
			synced: [...this.state.synced],
			syncing: new Set(this.state.syncing),
			totalOperations: this.state.totalOperations,
			successRate: this.state.successRate,
			averageSyncTime: this.state.averageSyncTime
		};
	}
}