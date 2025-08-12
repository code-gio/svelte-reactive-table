/**
 * Adapter type definitions exports for svelte-reactive-table
 */

export type {
	AdapterConfig,
	AdapterType,
	ConnectionConfig,
	RetryConfig,
	SSLConfig,
	PoolConfig,
	AuthConfig,
	AuthType,
	OAuthConfig,
	JWTConfig,
	TokenRefreshConfig,
	AdapterOptions,
	CacheConfig,
	CacheStrategy,
	CacheStorage,
	BatchConfig,
	TransformConfig,
	DataTransformer,
	ErrorTransformer,
	ValidationConfig,
	PerformanceConfig,
	DebugConfig,
	DebugLevel,
	Logger,
	CRUDOperations,
	ReadOptions,
	PaginationOptions,
	SearchOptions,
	CountOptions,
	RealtimeSubscription,
	SubscriptionConfig,
	AdapterState,
	CacheStatus,
	ConnectionQuality,
	AdapterCapabilities,
	AdapterMetadata,
	AdapterMetrics,
	TableAdapter
} from './AdapterTypes.js';

// Export ValidationResult separately to avoid conflicts
export type { AdapterValidationResult } from './AdapterTypes.js';