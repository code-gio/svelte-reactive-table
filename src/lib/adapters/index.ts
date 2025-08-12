/**
 * All adapter exports for svelte-reactive-table
 */

// Base adapter
export * from './base/index.js';

// Firebase adapter
export * from './firebase/index.js';

// REST adapter
export * from './rest/index.js';

// Supabase adapter
export * from './supabase/index.js';

// Adapter factory
import { FirebaseAdapter } from './firebase/FirebaseAdapter.svelte.js';
import { RestAdapter } from './rest/RestAdapter.svelte.js';
import { SupabaseAdapter } from './supabase/SupabaseAdapter.svelte.js';
import { MemoryAdapter } from './base/MemoryAdapter.svelte.js';
import type { AdapterConfig } from '../types/adapters/index.js';
import type { DataRow } from '../types/core/index.js';

/**
 * Create adapter instance from configuration
 */
export function createAdapter<T extends DataRow = DataRow>(config: AdapterConfig, initialData?: T[]): any {
	switch (config.type) {
		case 'firebase':
			// For demo purposes, use memory adapter instead of Firebase
			// since Firebase requires additional configuration
			return new MemoryAdapter<T>(config, initialData || []);
		case 'rest':
			// For demo purposes, use memory adapter instead of REST
			// since REST requires additional configuration
			return new MemoryAdapter<T>(config, initialData || []);
		case 'supabase':
			// For demo purposes, use memory adapter instead of Supabase
			// since Supabase requires additional configuration
			return new MemoryAdapter<T>(config, initialData || []);
		case 'memory':
			return new MemoryAdapter<T>(config, initialData || []);
		default:
			throw new Error(`Unsupported adapter type: ${config.type}`);
	}
}