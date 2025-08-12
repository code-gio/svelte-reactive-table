/**
 * Main exports for svelte-reactive-table library
 * Reactive table library for Svelte 5 with real-time database synchronization
 */

// Core exports
export { ReactiveTable, TableEngine } from './core/index.js';
export { ReactiveTableState } from './core/TableState.svelte.js';
export { RealtimeSync } from './core/RealtimeSync.svelte.js';

// Type exports - be specific to avoid conflicts
export type {
  // Core types
  DataRow,
  DataChangeEvent,
  TableSchema,
  TableConfig,
  TableOptions,
  EditingOptions,
  // State types
  StateChangeEvent as TableStateChangeEvent,
  OptimisticUpdate,
  ConflictResolutionStrategy,
  // Adapter types
  AdapterState,
  AdapterConfig,
  AdapterType,
  TableAdapter
} from './types/index.js';

// Adapter exports
export { BaseAdapter } from './adapters/base/BaseAdapter.js';
export { FirebaseAdapter } from './adapters/firebase/FirebaseAdapter.svelte.js';
export { FirebaseAuthManager as FirebaseAuth } from './adapters/firebase/FirebaseAuth.svelte.js';
export { SupabaseAdapter } from './adapters/supabase/SupabaseAdapter.svelte.js';
export { RestAdapter } from './adapters/rest/RestAdapter.svelte.js';

// Component exports
export { default as ReactiveTableComponent } from './components/table/ReactiveTable.svelte';

// Additional component exports for advanced usage
export { default as TableContainer } from './components/table/TableContainer.svelte';
export { default as TableSkeleton } from './components/table/TableSkeleton.svelte';
export { default as TableHeader } from './components/header/TableHeader.svelte';
export { default as HeaderCell } from './components/header/HeaderCell.svelte';
export { default as SortControls } from './components/header/SortControls.svelte';
export { default as ColumnResizer } from './components/header/ColumnResizer.svelte';
export { default as TableBody } from './components/body/TableBody.svelte';
export { default as TableRow } from './components/body/TableRow.svelte';
export { default as TableCell } from './components/body/TableCell.svelte';
export { default as EditableCell } from './components/cells/EditableCell.svelte';

// Utility exports
export { VirtualScrollManager } from './utils/performance/virtualization.js';
export { OptimisticUpdateManager } from './utils/sync/optimisticUpdates.svelte.js';
export { AdvancedFilterManager } from './utils/data/advancedFilters.js';
export { DataExporter } from './utils/export/dataExporter.js';