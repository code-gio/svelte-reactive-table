/**
 * Base adapter interfaces and types for svelte-reactive-table
 */

import type { DataRow, DataChangeEvent } from '../core/DataTypes.js';
import type { TableFilter, TableSort } from '../core/TableTypes.js';

/**
 * Base adapter configuration
 */
export interface AdapterConfig {
	/** Adapter type identifier */
	type: AdapterType;
	
	/** Connection configuration */
	connection?: ConnectionConfig;
	
	/** Authentication configuration */
	auth?: AuthConfig;
	
	/** Adapter options */
	options?: AdapterOptions;
	
	/** Custom adapter metadata */
	meta?: Record<string, any>;
}

/**
 * Supported adapter types
 */
export type AdapterType = 
	| 'firebase'
	| 'supabase'
	| 'rest'
	| 'graphql'
	| 'websocket'
	| 'memory'
	| 'custom';

/**
 * Connection configuration
 */
export interface ConnectionConfig {
	/** Connection URL/endpoint */
	url?: string;
	
	/** API key */
	apiKey?: string;
	
	/** Connection timeout (ms) */
	timeout?: number;
	
	/** Retry configuration */
	retry?: RetryConfig;
	
	/** SSL/TLS configuration */
	ssl?: SSLConfig;
	
	/** Custom headers */
	headers?: Record<string, string>;
	
	/** Connection pool settings */
	pool?: PoolConfig;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
	/** Maximum number of retries */
	maxRetries: number;
	
	/** Initial retry delay (ms) */
	initialDelay: number;
	
	/** Maximum retry delay (ms) */
	maxDelay: number;
	
	/** Backoff multiplier */
	backoffMultiplier: number;
	
	/** Jitter enabled */
	jitter: boolean;
}

/**
 * SSL configuration
 */
export interface SSLConfig {
	/** SSL enabled */
	enabled: boolean;
	
	/** Verify certificates */
	verifyCertificate: boolean;
	
	/** Custom CA certificates */
	caCerts?: string[];
}

/**
 * Connection pool configuration
 */
export interface PoolConfig {
	/** Minimum connections */
	min: number;
	
	/** Maximum connections */
	max: number;
	
	/** Connection idle timeout (ms) */
	idleTimeout: number;
	
	/** Connection acquire timeout (ms) */
	acquireTimeout: number;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
	/** Authentication type */
	type: AuthType;
	
	/** API key */
	apiKey?: string;
	
	/** Bearer token */
	token?: string;
	
	/** Username/password */
	credentials?: {
		username: string;
		password: string;
	};
	
	/** OAuth configuration */
	oauth?: OAuthConfig;
	
	/** JWT configuration */
	jwt?: JWTConfig;
	
	/** Custom authentication headers */
	headers?: Record<string, string>;
	
	/** Token refresh configuration */
	refresh?: TokenRefreshConfig;
}

/**
 * Authentication types
 */
export type AuthType = 
	| 'none'
	| 'api_key'
	| 'bearer_token'
	| 'basic_auth'
	| 'oauth2'
	| 'jwt'
	| 'custom';

/**
 * OAuth configuration
 */
export interface OAuthConfig {
	/** Client ID */
	clientId: string;
	
	/** Client secret */
	clientSecret?: string;
	
	/** Authorization URL */
	authUrl: string;
	
	/** Token URL */
	tokenUrl: string;
	
	/** Scopes */
	scopes: string[];
	
	/** Redirect URI */
	redirectUri: string;
}

/**
 * JWT configuration
 */
export interface JWTConfig {
	/** JWT secret */
	secret?: string;
	
	/** JWT algorithm */
	algorithm?: string;
	
	/** Token expiration */
	expiresIn?: string;
	
	/** Token issuer */
	issuer?: string;
	
	/** Token audience */
	audience?: string;
}

/**
 * Token refresh configuration
 */
export interface TokenRefreshConfig {
	/** Auto-refresh tokens */
	autoRefresh: boolean;
	
	/** Refresh threshold (seconds before expiry) */
	refreshThreshold: number;
	
	/** Refresh endpoint */
	refreshUrl?: string;
	
	/** Refresh token */
	refreshToken?: string;
}

/**
 * Adapter options
 */
export interface AdapterOptions {
	/** Enable real-time synchronization */
	realtime?: boolean;
	
	/** Enable offline support */
	offline?: boolean;
	
	/** Cache configuration */
	cache?: CacheConfig;
	
	/** Batch operation settings */
	batch?: BatchConfig;
	
	/** Conflict resolution strategy */
	conflictResolution?: ConflictResolutionStrategy;
	
	/** Data transformation options */
	transform?: TransformConfig;
	
	/** Validation options */
	validation?: ValidationConfig;
	
	/** Performance options */
	performance?: PerformanceConfig;
	
	/** Debug options */
	debug?: DebugConfig;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
	/** Cache enabled */
	enabled: boolean;
	
	/** Cache TTL (ms) */
	ttl: number;
	
	/** Maximum cache size */
	maxSize: number;
	
	/** Cache strategy */
	strategy: CacheStrategy;
	
	/** Cache storage type */
	storage: CacheStorage;
}

/**
 * Cache strategies
 */
export type CacheStrategy = 
	| 'lru'
	| 'lfu'
	| 'fifo'
	| 'ttl'
	| 'custom';

/**
 * Cache storage types
 */
export type CacheStorage = 
	| 'memory'
	| 'localStorage'
	| 'sessionStorage'
	| 'indexedDB'
	| 'custom';

/**
 * Batch operation configuration
 */
export interface BatchConfig {
	/** Batch enabled */
	enabled: boolean;
	
	/** Batch size */
	size: number;
	
	/** Batch timeout (ms) */
	timeout: number;
	
	/** Auto-flush on page unload */
	autoFlush: boolean;
}

/**
 * Conflict resolution strategies
 */
export type ConflictResolutionStrategy = 
	| 'client_wins'
	| 'server_wins'
	| 'last_write_wins'
	| 'merge'
	| 'manual'
	| 'custom';

/**
 * Transform configuration
 */
export interface TransformConfig {
	/** Request transformers */
	request?: DataTransformer[];
	
	/** Response transformers */
	response?: DataTransformer[];
	
	/** Error transformers */
	error?: ErrorTransformer[];
}

/**
 * Data transformer interface
 */
export interface DataTransformer {
	/** Transformer name */
	name: string;
	
	/** Transform function */
	transform: (data: any) => any;
	
	/** Transformer priority */
	priority: number;
	
	/** Enabled flag */
	enabled: boolean;
}

/**
 * Error transformer interface
 */
export interface ErrorTransformer {
	/** Transformer name */
	name: string;
	
	/** Transform function */
	transform: (error: any) => Error;
	
	/** Error type matcher */
	matcher?: (error: any) => boolean;
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
	/** Client-side validation */
	client: boolean;
	
	/** Server-side validation */
	server: boolean;
	
	/** Validation on save */
	onSave: boolean;
	
	/** Validation on change */
	onChange: boolean;
	
	/** Stop on first error */
	stopOnError: boolean;
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
	/** Enable query optimization */
	optimizeQueries: boolean;
	
	/** Connection pooling */
	connectionPooling: boolean;
	
	/** Lazy loading */
	lazyLoading: boolean;
	
	/** Pagination size */
	paginationSize: number;
	
	/** Request debounce (ms) */
	debounce: number;
	
	/** Request throttle (ms) */
	throttle: number;
}

/**
 * Debug configuration
 */
export interface DebugConfig {
	/** Enable debug logging */
	enabled: boolean;
	
	/** Log level */
	level: DebugLevel;
	
	/** Log network requests */
	logRequests: boolean;
	
	/** Log responses */
	logResponses: boolean;
	
	/** Log errors */
	logErrors: boolean;
	
	/** Custom logger */
	logger?: Logger;
}

/**
 * Debug levels
 */
export type DebugLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * Logger interface
 */
export interface Logger {
	error(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
	info(message: string, ...args: any[]): void;
	debug(message: string, ...args: any[]): void;
	trace(message: string, ...args: any[]): void;
}

/**
 * CRUD operations interface
 */
export interface CRUDOperations<T extends DataRow = DataRow> {
	/** Create new record */
	create(data: Partial<T>): Promise<T>;
	
	/** Read records with optional filters */
	read(options?: ReadOptions): Promise<T[]>;
	
	/** Update existing record */
	update(id: string, data: Partial<T>): Promise<T>;
	
	/** Delete record */
	delete(id: string): Promise<void>;
	
	/** Bulk create records */
	bulkCreate(data: Partial<T>[]): Promise<T[]>;
	
	/** Bulk update records */
	bulkUpdate(updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]>;
	
	/** Bulk delete records */
	bulkDelete(ids: string[]): Promise<void>;
	
	/** Count records */
	count(options?: CountOptions): Promise<number>;
	
	/** Check if record exists */
	exists(id: string): Promise<boolean>;
}

/**
 * Read options
 */
export interface ReadOptions {
	/** Filters to apply */
	filters?: TableFilter[];
	
	/** Sorting options */
	sorts?: TableSort[];
	
	/** Pagination options */
	pagination?: PaginationOptions;
	
	/** Fields to include */
	select?: string[];
	
	/** Relations to include */
	include?: string[];
	
	/** Search query */
	search?: SearchOptions;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
	/** Page number (0-based) */
	page: number;
	
	/** Items per page */
	limit: number;
	
	/** Offset */
	offset?: number;
	
	/** Cursor-based pagination */
	cursor?: string;
}

/**
 * Search options
 */
export interface SearchOptions {
	/** Search query */
	query: string;
	
	/** Fields to search */
	fields?: string[];
	
	/** Search operator */
	operator?: 'and' | 'or';
	
	/** Case sensitive */
	caseSensitive?: boolean;
	
	/** Fuzzy search */
	fuzzy?: boolean;
	
	/** Highlight matches */
	highlight?: boolean;
}

/**
 * Count options
 */
export interface CountOptions {
	/** Filters to apply */
	filters?: TableFilter[];
	
	/** Group by fields */
	groupBy?: string[];
	
	/** Having clause */
	having?: TableFilter[];
}

/**
 * Real-time subscription interface
 */
export interface RealtimeSubscription<T extends DataRow = DataRow> {
	/** Subscribe to data changes */
	subscribe(callback: (event: DataChangeEvent<T>) => void): () => void;
	
	/** Get current subscription status */
	isSubscribed(): boolean;
	
	/** Get subscription configuration */
	getConfig(): SubscriptionConfig;
	
	/** Update subscription filters */
	updateFilters(filters: TableFilter[]): void;
	
	/** Pause subscription */
	pause(): void;
	
	/** Resume subscription */
	resume(): void;
	
	/** Unsubscribe */
	unsubscribe(): void;
}

/**
 * Subscription configuration
 */
export interface SubscriptionConfig {
	/** Subscribe to inserts */
	insert?: boolean;
	
	/** Subscribe to updates */
	update?: boolean;
	
	/** Subscribe to deletes */
	delete?: boolean;
	
	/** Event filters */
	filters?: TableFilter[];
	
	/** Debounce events (ms) */
	debounce?: number;
	
	/** Batch events */
	batch?: boolean;
	
	/** Include old values */
	includeOldValues?: boolean;
}

/**
 * Adapter state interface
 */
export interface AdapterState {
	/** Connection status */
	connected: boolean;
	
	/** Loading status */
	loading: boolean;
	
	/** Error status */
	error: string | null;
	
	/** Last sync timestamp */
	lastSync: Date | null;
	
	/** Pending operations count */
	pendingOperations: number;
	
	/** Cache status */
	cacheStatus: CacheStatus;
	
	/** Connection quality */
	connectionQuality: ConnectionQuality;
}

/**
 * Cache status
 */
export interface CacheStatus {
	/** Cache enabled */
	enabled: boolean;
	
	/** Cache hit ratio */
	hitRatio: number;
	
	/** Cache size */
	size: number;
	
	/** Last cache update */
	lastUpdate: Date | null;
}

/**
 * Connection quality levels
 */
export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'offline';