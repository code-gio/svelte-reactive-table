/**
 * RealtimeSync.svelte.ts - Real-time synchronization manager for table data
 * Handles real-time data updates, conflict resolution, and optimistic updates
 */

import type { 
	DataRow, 
	DataChangeEvent, 
	TableAdapter,
	ConflictResolutionStrategy,
	OptimisticUpdate 
} from '../types/core/index.js';

export interface RealtimeSyncConfig {
	/** Enable real-time synchronization */
	enabled: boolean;
	/** Conflict resolution strategy */
	conflictResolution: ConflictResolutionStrategy;
	/** Debounce interval for batching updates (ms) */
	debounceMs: number;
	/** Maximum retry attempts for failed syncs */
	maxRetries: number;
	/** Enable optimistic updates */
	optimisticUpdates: boolean;
	/** Auto-reconnect on connection loss */
	autoReconnect: boolean;
}

export interface SyncState {
	connected: boolean;
	syncing: boolean;
	lastSyncTime: Date | null;
	pendingUpdates: OptimisticUpdate[];
	conflicts: ConflictEvent[];
	error: string | null;
}

export interface ConflictEvent {
	id: string;
	type: 'create' | 'update' | 'delete' | 'bulk_update' | 'bulk_delete';
	localData: DataRow;
	remoteData: DataRow;
	timestamp: Date;
	resolved: boolean;
}

/**
 * Real-time synchronization manager using Svelte 5 runes
 */
export class RealtimeSync<T extends DataRow = DataRow> {
	private adapter: TableAdapter<T>;
	private config: RealtimeSyncConfig;
	
	// Reactive state using Svelte 5 runes
	public state = $state<SyncState>({
		connected: false,
		syncing: false,
		lastSyncTime: null,
		pendingUpdates: [],
		conflicts: [],
		error: null
	});
	
	// Private state
	private subscriptions = new Map<string, () => void>();
	private updateQueue: DataChangeEvent<T>[] = [];
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private retryCount = 0;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	
	constructor(adapter: TableAdapter<T>, config: Partial<RealtimeSyncConfig> = {}) {
		this.adapter = adapter;
		this.config = {
			enabled: true,
			conflictResolution: 'last-write-wins',
			debounceMs: 100,
			maxRetries: 3,
			optimisticUpdates: true,
			autoReconnect: true,
			...config
		};
	}
	
	/**
	 * Initialize real-time synchronization
	 */
	async initialize(): Promise<void> {
		if (!this.config.enabled) return;
		
		try {
			// Set up real-time listeners
			await this.setupRealtimeListeners();
			
			// Mark as connected
			this.state.connected = true;
			this.state.error = null;
			this.retryCount = 0;
			
		} catch (error) {
			this.state.error = (error as Error).message;
			this.state.connected = false;
			
			// Auto-reconnect if enabled
			if (this.config.autoReconnect) {
				this.scheduleReconnect();
			}
		}
	}
	
	/**
	 * Set up real-time listeners for data changes
	 */
	private async setupRealtimeListeners(): Promise<void> {
		// Listen for data changes from adapter
		const unsubscribe = this.adapter.onDataChange?.((event: DataChangeEvent<T>) => {
			this.handleRemoteChange(event);
		});
		
		if (unsubscribe) {
			this.subscriptions.set('dataChange', unsubscribe);
		}
		
		// Listen for connection state changes
		const connectionUnsubscribe = this.adapter.onConnectionChange?.((connected: boolean) => {
			this.state.connected = connected;
			
			if (!connected && this.config.autoReconnect) {
				this.scheduleReconnect();
			}
		});
		
		if (connectionUnsubscribe) {
			this.subscriptions.set('connection', connectionUnsubscribe);
		}
	}
	
	/**
	 * Handle remote data changes
	 */
	private handleRemoteChange(event: DataChangeEvent<T>): void {
		// Check for conflicts with pending optimistic updates
		const conflicts = this.detectConflicts(event);
		
		if (conflicts.length > 0) {
			// Handle conflicts based on strategy
			this.resolveConflicts(conflicts, event);
		} else {
			// No conflicts, apply change directly
			this.applyRemoteChange(event);
		}
		
		// Update last sync time
		this.state.lastSyncTime = new Date();
	}
	
	/**
	 * Detect conflicts between remote changes and local optimistic updates
	 */
	private detectConflicts(remoteEvent: DataChangeEvent<T>): ConflictEvent[] {
		const conflicts: ConflictEvent[] = [];
		
		// Check pending optimistic updates for conflicts
		for (const update of this.state.pendingUpdates) {
			if (this.isConflicting(update, remoteEvent)) {
				const conflict: ConflictEvent = {
					id: `conflict-${Date.now()}-${Math.random()}`,
					type: remoteEvent.type,
					localData: update.data,
					remoteData: remoteEvent.data || update.data,
					timestamp: new Date(),
					resolved: false
				};
				conflicts.push(conflict);
			}
		}
		
		return conflicts;
	}
	
	/**
	 * Check if an optimistic update conflicts with a remote event
	 */
	private isConflicting(localUpdate: OptimisticUpdate, remoteEvent: DataChangeEvent<T>): boolean {
		// Same record ID and both are updates/deletes
		return (
			String(localUpdate.data.id) === String(remoteEvent.data?.id) &&
			(localUpdate.type === 'update' || localUpdate.type === 'delete') &&
			(remoteEvent.type === 'update' || remoteEvent.type === 'delete')
		);
	}
	
	/**
	 * Resolve conflicts based on configured strategy
	 */
	private resolveConflicts(conflicts: ConflictEvent[], remoteEvent: DataChangeEvent<T>): void {
		for (const conflict of conflicts) {
			switch (this.config.conflictResolution) {
				case 'last-write-wins':
					// Remote change wins, discard local optimistic update
					this.removeOptimisticUpdate(conflict.localData.id);
					this.applyRemoteChange({
						type: remoteEvent.type,
						rows: remoteEvent.data ? [remoteEvent.data] : [],
						source: 'sync',
						timestamp: remoteEvent.timestamp,
						transactionId: remoteEvent.transactionId,
						changes: remoteEvent.changes
					});
					conflict.resolved = true;
					break;
					
				case 'first-write-wins':
					// Local optimistic update wins, ignore remote change
					conflict.resolved = true;
					break;
					
				case 'manual':
					// Add to conflicts list for manual resolution
					this.state.conflicts.push(conflict);
					break;
					
				case 'merge':
							// Attempt to merge changes
		const merged = this.mergeChanges(conflict.localData as T, conflict.remoteData as T);
					if (merged) {
						this.removeOptimisticUpdate(conflict.localData.id);
						this.applyRemoteChange({
							type: remoteEvent.type,
							rows: [merged],
							source: 'sync',
							timestamp: remoteEvent.timestamp,
							transactionId: remoteEvent.transactionId,
							changes: remoteEvent.changes
						});
						conflict.resolved = true;
					} else {
						// Merge failed, fall back to manual resolution
						this.state.conflicts.push(conflict);
					}
					break;
			}
		}
	}
	
	/**
	 * Attempt to merge local and remote changes
	 */
	private mergeChanges(localData: T, remoteData: T): T | null {
		try {
			// Simple merge strategy: combine non-conflicting fields
			const merged = { ...remoteData };
			
			// For each field in local data, keep if it's newer or different
			for (const [key, localValue] of Object.entries(localData)) {
				if (key === 'id') continue; // Never merge IDs
				
				const remoteValue = remoteData[key as keyof T];
				
				// If remote doesn't have this field, keep local
				if (remoteValue === undefined || remoteValue === null) {
					(merged as any)[key] = localValue;
				}
			}
			
			return merged;
		} catch {
			return null; // Merge failed
		}
	}
	
	/**
	 * Apply remote change to data
	 */
	private applyRemoteChange(event: DataChangeEvent<T>): void {
		// Emit event for the table to handle
		this.adapter.emit?.('dataChange', event);
	}
	
	/**
	 * Add optimistic update
	 */
	addOptimisticUpdate(update: OptimisticUpdate): void {
		if (!this.config.optimisticUpdates) return;
		
		// Remove any existing update for the same record
		this.removeOptimisticUpdate(update.data.id);
		
		// Add new update
		this.state.pendingUpdates.push(update);
		
		// Schedule sync
		this.scheduleSync();
	}
	
	/**
	 * Remove optimistic update
	 */
	private removeOptimisticUpdate(id: string | number): void {
		const index = this.state.pendingUpdates.findIndex(
			update => String(update.data.id) === String(id)
		);
		
		if (index !== -1) {
			this.state.pendingUpdates.splice(index, 1);
		}
	}
	
	/**
	 * Schedule synchronization with debouncing
	 */
	private scheduleSync(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
		
		this.debounceTimer = setTimeout(() => {
			this.performSync();
		}, this.config.debounceMs);
	}
	
	/**
	 * Perform actual synchronization
	 */
	private async performSync(): Promise<void> {
		if (this.state.syncing || !this.state.connected) return;
		
		this.state.syncing = true;
		
		try {
			// Process pending updates
			for (const update of this.state.pendingUpdates) {
				await this.syncUpdate(update);
			}
			
			// Clear processed updates
			this.state.pendingUpdates = [];
			this.state.error = null;
			this.retryCount = 0;
			
		} catch (error) {
			this.state.error = (error as Error).message;
			this.retryCount++;
			
			if (this.retryCount < this.config.maxRetries) {
				// Retry after delay
				setTimeout(() => this.performSync(), 1000 * this.retryCount);
			}
		} finally {
			this.state.syncing = false;
		}
	}
	
	/**
	 * Sync individual update
	 */
	private async syncUpdate(update: OptimisticUpdate): Promise<void> {
		switch (update.type) {
			case 'create':
				await this.adapter.create(update.data as Partial<T>);
				break;
			case 'update':
				await this.adapter.update(String(update.data.id), update.data as Partial<T>);
				break;
			case 'delete':
				await this.adapter.delete(String(update.data.id));
				break;
		}
	}
	
	/**
	 * Schedule reconnection
	 */
	private scheduleReconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}
		
		const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000); // Exponential backoff, max 30s
		
		this.reconnectTimer = setTimeout(() => {
			this.initialize();
		}, delay);
	}
	
	/**
	 * Manually resolve a conflict
	 */
	async resolveConflict(conflictId: string, resolution: 'local' | 'remote' | T): Promise<void> {
		const conflictIndex = this.state.conflicts.findIndex(c => c.id === conflictId);
		if (conflictIndex === -1) return;
		
		const conflict = this.state.conflicts[conflictIndex];
		
		let resolvedData: T;
		
		if (resolution === 'local') {
					resolvedData = conflict.localData as T;
	} else if (resolution === 'remote') {
		resolvedData = conflict.remoteData as T;
		} else {
			resolvedData = resolution;
		}
		
		// Apply resolution
		await this.adapter.update(String(resolvedData.id), resolvedData);
		
		// Remove conflict from list
		this.state.conflicts.splice(conflictIndex, 1);
		
		// Remove corresponding optimistic update
		this.removeOptimisticUpdate(conflict.localData.id);
	}
	
	/**
	 * Force full synchronization
	 */
	async forcSync(): Promise<void> {
		this.state.syncing = true;
		
		try {
			// Refresh all data from server
			await this.adapter.refresh();
			
			// Clear all pending updates and conflicts
			this.state.pendingUpdates = [];
			this.state.conflicts = [];
			this.state.error = null;
			this.state.lastSyncTime = new Date();
			
		} catch (error) {
			this.state.error = (error as Error).message;
		} finally {
			this.state.syncing = false;
		}
	}
	
	/**
	 * Cleanup and disconnect
	 */
	destroy(): void {
		// Clear timers
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}
		
		// Unsubscribe from all listeners
		for (const unsubscribe of this.subscriptions.values()) {
			unsubscribe();
		}
		this.subscriptions.clear();
		
		// Clear state
		this.state.connected = false;
		this.state.syncing = false;
		this.state.pendingUpdates = [];
		this.state.conflicts = [];
	}
	
	// Derived getters for computed state
	get isConnected(): boolean {
		return this.state.connected;
	}
	
	get hasPendingUpdates(): boolean {
		return this.state.pendingUpdates.length > 0;
	}
	
	get hasConflicts(): boolean {
		return this.state.conflicts.length > 0;
	}
	
	get lastSyncTime(): Date | null {
		return this.state.lastSyncTime;
	}
}