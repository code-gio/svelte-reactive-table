/**
 * Reactive adapter state management for svelte-reactive-table
 */

import type { AdapterState, CacheStatus, ConnectionQuality } from '../../types/adapters/index.js';

/**
 * Reactive adapter state using Svelte 5 runes
 */
export class ReactiveAdapterState implements AdapterState {
	// Core state using $state rune
	connected = $state(false);
	loading = $state(false);
	error = $state<string | null>(null);
	lastSync = $state<Date | null>(null);
	pendingOperations = $state(0);
	
	// Cache state
	private _cacheEnabled = $state(false);
	private _cacheHitRatio = $state(0);
	private _cacheSize = $state(0);
	private _lastCacheUpdate = $state<Date | null>(null);
	
	// Connection quality
	connectionQuality = $state<ConnectionQuality>('offline');
	
	// Derived cache status using $derived
	get cacheStatus(): CacheStatus {
		return {
			enabled: this._cacheEnabled,
			hitRatio: this._cacheHitRatio,
			size: this._cacheSize,
			lastUpdate: this._lastCacheUpdate
		};
	}
	
	// Connection quality derived from other state
	isConnected = $derived(() => this.connected && !this.error);
	isHealthy = $derived(() => (this.connected && !this.error) && this.connectionQuality !== 'poor');
	
	/**
	 * Update connection state
	 */
	setConnected(connected: boolean) {
		this.connected = connected;
		this.updateConnectionQuality();
	}
	
	/**
	 * Update loading state
	 */
	setLoading(loading: boolean) {
		this.loading = loading;
	}
	
	/**
	 * Update error state
	 */
	setError(error: string | null) {
		this.error = error;
		this.updateConnectionQuality();
	}
	
	/**
	 * Update last sync timestamp
	 */
	updateLastSync() {
		this.lastSync = new Date();
	}
	
	/**
	 * Increment pending operations
	 */
	incrementPendingOperations() {
		this.pendingOperations++;
	}
	
	/**
	 * Decrement pending operations
	 */
	decrementPendingOperations() {
		if (this.pendingOperations > 0) {
			this.pendingOperations--;
		}
	}
	
	/**
	 * Reset pending operations
	 */
	resetPendingOperations() {
		this.pendingOperations = 0;
	}
	
	/**
	 * Update cache status
	 */
	updateCacheStatus(status: Partial<CacheStatus>) {
		if (status.enabled !== undefined) {
			this._cacheEnabled = status.enabled;
		}
		if (status.hitRatio !== undefined) {
			this._cacheHitRatio = status.hitRatio;
		}
		if (status.size !== undefined) {
			this._cacheSize = status.size;
		}
		if (status.lastUpdate !== undefined) {
			this._lastCacheUpdate = status.lastUpdate;
		}
	}
	
	/**
	 * Update connection quality based on current state
	 */
	private updateConnectionQuality() {
		if (!this.connected || this.error) {
			this.connectionQuality = 'offline';
		} else if (this.pendingOperations > 10) {
			this.connectionQuality = 'poor';
		} else if (this.pendingOperations > 3) {
			this.connectionQuality = 'good';
		} else {
			this.connectionQuality = 'excellent';
		}
	}
	
	/**
	 * Reset state to initial values
	 */
	reset() {
		this.connected = false;
		this.loading = false;
		this.error = null;
		this.lastSync = null;
		this.pendingOperations = 0;
		this._cacheEnabled = false;
		this._cacheHitRatio = 0;
		this._cacheSize = 0;
		this._lastCacheUpdate = null;
		this.connectionQuality = 'offline';
	}
	
	/**
	 * Get state snapshot (non-reactive)
	 */
	getSnapshot(): AdapterState {
		return {
			connected: this.connected,
			loading: this.loading,
			error: this.error,
			lastSync: this.lastSync,
			pendingOperations: this.pendingOperations,
			cacheStatus: {
				enabled: this._cacheEnabled,
				hitRatio: this._cacheHitRatio,
				size: this._cacheSize,
				lastUpdate: this._lastCacheUpdate
			},
			connectionQuality: this.connectionQuality
		};
	}
}

/**
 * State change event interface
 */
export interface AdapterStateChangeEvent {
	type: 'connected' | 'loading' | 'error' | 'sync' | 'operations' | 'cache' | 'quality';
	previousValue: any;
	currentValue: any;
	timestamp: Date;
}

/**
 * Enhanced adapter state with change tracking (without event emission)
 * Uses pure reactive patterns instead of event-based architecture
 */
export class EventEmittingAdapterState extends ReactiveAdapterState {
	// Track previous values for change detection
	private previousConnected = false;
	private previousLoading = false;
	private previousError: string | null = null;
	private previousPendingOperations = 0;
	private previousQuality: ConnectionQuality = 'offline';
	
	// Derived change detection using $derived (no side effects)
	hasConnectionChanged = $derived(() => this.connected !== this.previousConnected);
	hasLoadingChanged = $derived(() => this.loading !== this.previousLoading);
	hasErrorChanged = $derived(() => this.error !== this.previousError);
	hasPendingOperationsChanged = $derived(() => this.pendingOperations !== this.previousPendingOperations);
	hasQualityChanged = $derived(() => this.connectionQuality !== this.previousQuality);
	
	/**
	 * Update previous values (call this after processing changes)
	 */
	updatePreviousValues() {
		this.previousConnected = this.connected;
		this.previousLoading = this.loading;
		this.previousError = this.error;
		this.previousPendingOperations = this.pendingOperations;
		this.previousQuality = this.connectionQuality;
	}
	
	/**
	 * Get state changes as a snapshot (no subscriptions needed)
	 */
	getStateChanges(): AdapterStateChangeEvent[] {
		const changes: AdapterStateChangeEvent[] = [];
		
		if (this.hasConnectionChanged()) {
			changes.push({
				type: 'connected',
				previousValue: this.previousConnected,
				currentValue: this.connected,
				timestamp: new Date()
			});
		}
		
		if (this.hasLoadingChanged()) {
			changes.push({
				type: 'loading',
				previousValue: this.previousLoading,
				currentValue: this.loading,
				timestamp: new Date()
			});
		}
		
		if (this.hasErrorChanged()) {
			changes.push({
				type: 'error',
				previousValue: this.previousError,
				currentValue: this.error,
				timestamp: new Date()
			});
		}
		
		return changes;
	}
	
	/**
	 * Destroy state and reset
	 */
	destroy() {
		this.reset();
		this.updatePreviousValues();
	}
}