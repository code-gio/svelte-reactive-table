/**
 * Main exports for svelte-reactive-table library
 * Reactive table library for Svelte 5 with real-time database synchronization
 */

// Core exports
export { ReactiveTable, TableEngine } from './core/index.js';
export { ReactiveTableState } from './core/TableState.svelte.js';

// Type exports - be specific to avoid conflicts
export type {
  // Core types
  DataRow,
  DataChangeEvent,
  TableSchema,
  TableConfig,
  TableOptions,
  // State types
  StateChangeEvent as TableStateChangeEvent,
  // Adapter types
  AdapterState,
  AdapterConfig,
  AdapterType
} from './types/index.js';

// Adapter exports
export { BaseAdapter } from './adapters/base/BaseAdapter.js';
export { FirebaseAdapter } from './adapters/firebase/FirebaseAdapter.svelte.js';
export { FirebaseAuthManager as FirebaseAuth } from './adapters/firebase/FirebaseAuth.svelte.js';