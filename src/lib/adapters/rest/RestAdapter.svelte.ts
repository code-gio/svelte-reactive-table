/**
 * REST API adapter for svelte-reactive-table
 * Provides integration with RESTful APIs
 */

import type { 
	DataRow,
	DataChangeEvent,
	TableAdapter,
	AdapterConfig,
	AdapterState,
	AdapterCapabilities,
	AdapterMetadata,
	AdapterMetrics,
	ReadOptions,
	CountOptions,
	ValidationResult,
	TableFilter,
	TableSort
} from '../../types/index.js';

export interface RestAdapterConfig extends AdapterConfig {
	/** Base API URL */
	baseUrl: string;
	
	/** Endpoints configuration */
	endpoints: {
		list: string;      // GET /items
		create: string;    // POST /items
		read: string;      // GET /items/:id
		update: string;    // PUT /items/:id
		delete: string;    // DELETE /items/:id
		count?: string;    // GET /items/count
		bulk?: {
			create: string;  // POST /items/bulk
			update: string;  // PATCH /items/bulk
			delete: string;  // DELETE /items/bulk
		};
	};
	
	/** Request configuration */
	request: {
		headers?: Record<string, string>;
		timeout?: number;
		retries?: number;
		retryDelay?: number;
	};
	
	/** Response configuration */
	response: {
		dataPath?: string;        // Path to data in response (e.g., 'data.items')
		countPath?: string;       // Path to count in response (e.g., 'data.total')
		errorPath?: string;       // Path to error in response (e.g., 'error.message')
		successStatus?: number[]; // HTTP status codes considered successful
	};
	
	/** Pagination configuration */
	pagination?: {
		pageParam: string;    // Query parameter name for page (e.g., 'page')
		limitParam: string;   // Query parameter name for limit (e.g., 'limit')
		offsetParam?: string; // Query parameter name for offset (e.g., 'offset')
		defaultLimit: number;
		maxLimit: number;
	};
	
	/** Filtering configuration */
	filtering?: {
		paramStyle: 'query' | 'body' | 'custom';
		operators: Record<string, string>; // Map internal operators to API operators
		customBuilder?: (filters: TableFilter[]) => Record<string, any>;
	};
	
	/** Sorting configuration */
	sorting?: {
		paramName: string;    // Query parameter name (e.g., 'sort')
		format: 'simple' | 'json' | 'custom';
		ascending: string;    // Ascending indicator (e.g., 'asc', '+')
		descending: string;   // Descending indicator (e.g., 'desc', '-')
		customBuilder?: (sorts: TableSort[]) => string;
	};
	
	/** Real-time configuration */
	realtime?: {
		enabled: boolean;
		type: 'polling' | 'sse' | 'websocket';
		interval?: number;     // Polling interval in ms
		endpoint?: string;     // SSE/WebSocket endpoint
	};
}

/**
 * REST API adapter implementation
 */
export class RestAdapter<T extends DataRow = DataRow> implements TableAdapter<T> {
	public readonly config: RestAdapterConfig;
	
	// Reactive state using Svelte 5 runes
	public state = $state<AdapterState>({
		connected: false,
		loading: false,
		error: null,
		lastSync: null,
		pendingOperations: 0,
		cacheStatus: {
			enabled: false,
			hitRatio: 0,
			size: 0,
			lastUpdate: null
		},
		connectionQuality: 'offline'
	});
	
	// Private state
	private eventListeners = new Map<string, Set<Function>>();
	private pollingTimer?: ReturnType<typeof setInterval>;
	private eventSource?: EventSource;
	private websocket?: WebSocket;
	private metrics: AdapterMetrics = {
		totalRequests: 0,
		averageResponseTime: 0,
		errorRate: 0,
		cacheHitRate: 0,
		dataTransferred: 0,
		connectionsOpened: 0,
		uptime: 0,
		lastReset: new Date()
	};
	private startTime = Date.now();
	private responseTimes: number[] = [];
	private requestErrors = 0;
	
	constructor(config: RestAdapterConfig) {
		this.config = {
			...config,
			request: {
				timeout: 10000,
				retries: 3,
				retryDelay: 1000,
				...config.request
			},
			response: {
				successStatus: [200, 201, 204],
				...config.response
			},
			pagination: {
				pageParam: 'page',
				limitParam: 'limit',
				defaultLimit: 50,
				maxLimit: 1000,
				...config.pagination
			}
		};
	}
	
	/**
	 * Connect to REST API
	 */
	async connect(): Promise<void> {
		try {
			this.state.loading = true;
			this.state.error = null;
			
			// Test connection with a simple request
			await this.testConnection();
			
			this.state.connected = true;
			this.state.connectionQuality = 'excellent';
			this.metrics.connectionsOpened++;
			
			// Set up real-time if enabled
			if (this.config.realtime?.enabled) {
				this.setupRealtime();
			}
			
		} catch (error) {
			this.state.error = (error as Error).message;
			this.state.connected = false;
			this.state.connectionQuality = 'offline';
			throw error;
		} finally {
			this.state.loading = false;
		}
	}
	
	/**
	 * Test API connection
	 */
	private async testConnection(): Promise<void> {
		const url = this.buildUrl(this.config.endpoints.list);
		const params = new URLSearchParams();
		
		if (this.config.pagination) {
			params.set(this.config.pagination.limitParam, '1');
		}
		
		const testUrl = `${url}?${params}`;
		
		const response = await this.makeRequest('GET', testUrl);
		if (!response.ok) {
			throw new Error(`Connection test failed: ${response.status} ${response.statusText}`);
		}
	}
	
	/**
	 * Disconnect from REST API
	 */
	async disconnect(): Promise<void> {
		// Clear polling timer
		if (this.pollingTimer) {
			clearInterval(this.pollingTimer);
			this.pollingTimer = undefined;
		}
		
		// Close EventSource
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = undefined;
		}
		
		// Close WebSocket
		if (this.websocket) {
			this.websocket.close();
			this.websocket = undefined;
		}
		
		this.state.connected = false;
		this.state.connectionQuality = 'offline';
		this.eventListeners.clear();
	}
	
	/**
	 * Check connection status
	 */
	isConnected(): boolean {
		return this.state.connected;
	}
	
	/**
	 * Refresh all data
	 */
	async refresh(): Promise<void> {
		this.emit('dataChange', {
			type: 'refresh',
			data: [] as any,
			timestamp: new Date()
		});
	}
	
	/**
	 * Create new record
	 */
	async create(data: Partial<T>): Promise<T> {
		const url = this.buildUrl(this.config.endpoints.create);
		const response = await this.makeRequest('POST', url, data);
		return this.extractData(response);
	}
	
	/**
	 * Read records with filtering, sorting, and pagination
	 */
	async read(options: ReadOptions = {}): Promise<T[]> {
		const url = this.buildUrl(this.config.endpoints.list);
		const params = new URLSearchParams();
		
		// Apply pagination
		if (options.pagination && this.config.pagination) {
			const { page, limit, offset } = options.pagination;
			params.set(this.config.pagination.pageParam, page.toString());
			params.set(this.config.pagination.limitParam, limit.toString());
			
			if (offset !== undefined && this.config.pagination.offsetParam) {
				params.set(this.config.pagination.offsetParam, offset.toString());
			}
		}
		
		// Apply sorting
		if (options.sorts && this.config.sorting) {
			const sortParam = this.buildSortParam(options.sorts);
			if (sortParam) {
				params.set(this.config.sorting.paramName, sortParam);
			}
		}
		
		// Apply filtering
		if (options.filters && this.config.filtering) {
			const filterParams = this.buildFilterParams(options.filters);
			for (const [key, value] of Object.entries(filterParams)) {
				params.set(key, String(value));
			}
		}
		
		const requestUrl = `${url}?${params}`;
		const response = await this.makeRequest('GET', requestUrl);
		const data = await this.extractData(response);
		
		return Array.isArray(data) ? data : [];
	}
	
	/**
	 * Update existing record
	 */
	async update(id: string, data: Partial<T>): Promise<T> {
		const url = this.buildUrl(this.config.endpoints.update.replace(':id', id));
		const response = await this.makeRequest('PUT', url, data);
		return this.extractData(response);
	}
	
	/**
	 * Delete record
	 */
	async delete(id: string): Promise<void> {
		const url = this.buildUrl(this.config.endpoints.delete.replace(':id', id));
		await this.makeRequest('DELETE', url);
	}
	
	/**
	 * Bulk create records
	 */
	async bulkCreate(data: Partial<T>[]): Promise<T[]> {
		if (!this.config.endpoints.bulk?.create) {
			// Fall back to sequential creates
			const results: T[] = [];
			for (const item of data) {
				const result = await this.create(item);
				results.push(result);
			}
			return results;
		}
		
		const url = this.buildUrl(this.config.endpoints.bulk.create);
		const response = await this.makeRequest('POST', url, data);
		const result = await this.extractData(response);
		
		return Array.isArray(result) ? result : [];
	}
	
	/**
	 * Bulk update records
	 */
	async bulkUpdate(updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]> {
		if (!this.config.endpoints.bulk?.update) {
			// Fall back to sequential updates
			const results: T[] = [];
			for (const update of updates) {
				const result = await this.update(update.id, update.data);
				results.push(result);
			}
			return results;
		}
		
		const url = this.buildUrl(this.config.endpoints.bulk.update);
		const response = await this.makeRequest('PATCH', url, updates);
		const result = await this.extractData(response);
		
		return Array.isArray(result) ? result : [];
	}
	
	/**
	 * Bulk delete records
	 */
	async bulkDelete(ids: string[]): Promise<void> {
		if (!this.config.endpoints.bulk?.delete) {
			// Fall back to sequential deletes
			for (const id of ids) {
				await this.delete(id);
			}
			return;
		}
		
		const url = this.buildUrl(this.config.endpoints.bulk.delete);
		await this.makeRequest('DELETE', url, { ids });
	}
	
	/**
	 * Count records
	 */
	async count(options: CountOptions = {}): Promise<number> {
		if (this.config.endpoints.count) {
			const url = this.buildUrl(this.config.endpoints.count);
			const params = new URLSearchParams();
			
			// Apply filtering
			if (options.filters && this.config.filtering) {
				const filterParams = this.buildFilterParams(options.filters);
				for (const [key, value] of Object.entries(filterParams)) {
					params.set(key, String(value));
				}
			}
			
			const requestUrl = `${url}?${params}`;
			const response = await this.makeRequest('GET', requestUrl);
			const data = await response.json();
			
			return this.extractCount(data);
		}
		
		// Fall back to reading all records and counting
		const data = await this.read({ filters: options.filters });
		return data.length;
	}
	
	/**
	 * Check if record exists
	 */
	async exists(id: string): Promise<boolean> {
		try {
			const url = this.buildUrl(this.config.endpoints.read.replace(':id', id));
			const response = await this.makeRequest('GET', url);
			return response.ok;
		} catch {
			return false;
		}
	}
	
	/**
	 * Private helper methods
	 */
	
	private buildUrl(endpoint: string): string {
		const baseUrl = this.config.baseUrl.replace(/\/$/, '');
		const path = endpoint.replace(/^\//, '');
		return `${baseUrl}/${path}`;
	}
	
	private async makeRequest(
		method: string,
		url: string,
		body?: any
	): Promise<Response> {
		const startTime = Date.now();
		this.state.pendingOperations++;
		this.metrics.totalRequests++;
		
		try {
			const headers = new Headers({
				'Content-Type': 'application/json',
				...this.config.request.headers
			});
			
			const options: RequestInit = {
				method,
				headers,
				signal: AbortSignal.timeout(this.config.request.timeout || 10000)
			};
			
			if (body && method !== 'GET') {
				options.body = JSON.stringify(body);
			}
			
			const response = await this.fetchWithRetry(url, options);
			
			// Record response time
			const responseTime = Date.now() - startTime;
			this.recordResponseTime(responseTime);
			
			// Check if response is successful
			const successStatus = this.config.response.successStatus || [200, 201, 204];
			if (!successStatus.includes(response.status)) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			
			this.state.connectionQuality = 'excellent';
			return response;
			
		} catch (error) {
			this.requestErrors++;
			this.state.connectionQuality = 'poor';
			throw error;
		} finally {
			this.state.pendingOperations--;
		}
	}
	
	private async fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
		const maxRetries = this.config.request.retries || 3;
		const retryDelay = this.config.request.retryDelay || 1000;
		
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				const response = await fetch(url, options);
				
				// Don't retry on client errors (4xx)
				if (response.status >= 400 && response.status < 500) {
					return response;
				}
				
				// Retry on server errors (5xx)
				if (response.status >= 500 && attempt < maxRetries) {
					await this.delay(retryDelay * Math.pow(2, attempt));
					continue;
				}
				
				return response;
			} catch (error) {
				if (attempt === maxRetries) {
					throw error;
				}
				
				await this.delay(retryDelay * Math.pow(2, attempt));
			}
		}
		
		throw new Error('Max retries exceeded');
	}
	
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	
	private async extractData(response: Response): Promise<any> {
		const data = await response.json();
		
		if (this.config.response.dataPath) {
			return this.getNestedProperty(data, this.config.response.dataPath);
		}
		
		return data;
	}
	
	private extractCount(data: any): number {
		if (this.config.response.countPath) {
			return this.getNestedProperty(data, this.config.response.countPath);
		}
		
		// Try common count property names
		return data.count || data.total || data.size || 0;
	}
	
	private getNestedProperty(obj: any, path: string): any {
		return path.split('.').reduce((current, key) => current?.[key], obj);
	}
	
	private buildSortParam(sorts: TableSort[]): string | null {
		if (!this.config.sorting) return null;
		
		const { format, ascending, descending, customBuilder } = this.config.sorting;
		
		if (customBuilder) {
			return customBuilder(sorts);
		}
		
		switch (format) {
			case 'simple':
				return sorts.map(sort => 
					`${sort.direction === 'asc' ? ascending : descending}${sort.column}`
				).join(',');
				
			case 'json':
				return JSON.stringify(sorts.map(sort => ({
					field: sort.column,
					direction: sort.direction
				})));
				
			default:
				return sorts.map(sort => 
					`${sort.column}:${sort.direction}`
				).join(',');
		}
	}
	
	private buildFilterParams(filters: TableFilter[]): Record<string, any> {
		if (!this.config.filtering) return {};
		
		const { paramStyle, operators, customBuilder } = this.config.filtering;
		
		if (customBuilder) {
			return customBuilder(filters);
		}
		
		const params: Record<string, any> = {};
		
		for (const filter of filters) {
			const operator = operators?.[filter.operator] || filter.operator;
			const paramName = `${filter.column}[${operator}]`;
			params[paramName] = filter.value;
		}
		
		return params;
	}
	
	/**
	 * Real-time functionality
	 */
	
	private setupRealtime(): void {
		if (!this.config.realtime?.enabled) return;
		
		switch (this.config.realtime.type) {
			case 'polling':
				this.setupPolling();
				break;
			case 'sse':
				this.setupServerSentEvents();
				break;
			case 'websocket':
				this.setupWebSocket();
				break;
		}
	}
	
	private setupPolling(): void {
		const interval = this.config.realtime?.interval || 5000;
		
		this.pollingTimer = setInterval(() => {
			this.refresh();
		}, interval);
	}
	
	private setupServerSentEvents(): void {
		if (!this.config.realtime?.endpoint) return;
		
		const url = this.buildUrl(this.config.realtime.endpoint);
		this.eventSource = new EventSource(url);
		
		this.eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				this.handleRealtimeEvent(data);
			} catch (error) {
				console.error('Error parsing SSE data:', error);
			}
		};
		
		this.eventSource.onerror = () => {
			this.state.connectionQuality = 'poor';
		};
	}
	
	private setupWebSocket(): void {
		if (!this.config.realtime?.endpoint) return;
		
		const url = this.buildUrl(this.config.realtime.endpoint).replace(/^http/, 'ws');
		this.websocket = new WebSocket(url);
		
		this.websocket.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				this.handleRealtimeEvent(data);
			} catch (error) {
				console.error('Error parsing WebSocket data:', error);
			}
		};
		
		this.websocket.onerror = () => {
			this.state.connectionQuality = 'poor';
		};
	}
	
	private handleRealtimeEvent(data: any): void {
		const changeEvent: DataChangeEvent<T> = {
			type: data.type || 'update',
			data: data.payload || data,
			timestamp: new Date(data.timestamp || Date.now())
		};
		
		this.emit('dataChange', changeEvent);
		this.state.lastSync = new Date();
	}
	
	/**
	 * Event management
	 */
	
	onDataChange(callback: (event: DataChangeEvent<T>) => void): () => void {
		return this.addEventListener('dataChange', callback);
	}
	
	onConnectionChange(callback: (connected: boolean) => void): () => void {
		return this.addEventListener('connectionChange', callback);
	}
	
	onError(callback: (error: Error) => void): () => void {
		return this.addEventListener('error', callback);
	}
	
	emit(event: string, data: any): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			for (const callback of listeners) {
				try {
					callback(data);
				} catch (error) {
					console.error('Error in event listener:', error);
				}
			}
		}
	}
	
	on(event: string, callback: (data: any) => void): () => void {
		return this.addEventListener(event, callback);
	}
	
	private addEventListener(event: string, callback: Function): () => void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}
		
		const listeners = this.eventListeners.get(event)!;
		listeners.add(callback);
		
		return () => {
			listeners.delete(callback);
			if (listeners.size === 0) {
				this.eventListeners.delete(event);
			}
		};
	}
	
	/**
	 * Adapter metadata and capabilities
	 */
	
	getCapabilities(): AdapterCapabilities {
		return {
			realtime: !!this.config.realtime?.enabled,
			transactions: false,
			bulk: !!(this.config.endpoints.bulk),
			search: !!this.config.filtering,
			files: false,
			offline: false,
			cache: false,
			pagination: !!this.config.pagination,
			sorting: !!this.config.sorting,
			filtering: !!this.config.filtering,
			maxConnections: 10,
			maxPayloadSize: 10 * 1024 * 1024 // 10MB
		};
	}
	
	getMetadata(): AdapterMetadata {
		return {
			name: 'REST API Adapter',
			version: '1.0.0',
			author: 'svelte-reactive-table',
			description: 'RESTful API adapter with configurable endpoints and real-time support',
			supportedDatabases: ['Any REST API'],
			documentation: 'https://restfulapi.net/'
		};
	}
	
	validateConfig(): ValidationResult[] {
		const results: ValidationResult[] = [];
		
		if (!this.config.baseUrl) {
			results.push({
				valid: false,
				message: 'Base URL is required',
				field: 'baseUrl',
				code: 'MISSING_BASE_URL'
			});
		}
		
		if (!this.config.endpoints.list) {
			results.push({
				valid: false,
				message: 'List endpoint is required',
				field: 'endpoints.list',
				code: 'MISSING_LIST_ENDPOINT'
			});
		}
		
		return results.length === 0 ? [{ valid: true }] : results;
	}
	
	getMetrics(): AdapterMetrics {
		this.metrics.uptime = Date.now() - this.startTime;
		this.metrics.errorRate = this.metrics.totalRequests > 0 ? 
			(this.requestErrors / this.metrics.totalRequests) * 100 : 0;
		return { ...this.metrics };
	}
	
	/**
	 * Cleanup and destroy
	 */
	async destroy(): Promise<void> {
		await this.disconnect();
		this.eventListeners.clear();
		this.responseTimes = [];
	}
	
	/**
	 * Private helper methods
	 */
	
	private recordResponseTime(responseTime: number): void {
		this.responseTimes.push(responseTime);
		
		// Keep only last 100 response times
		if (this.responseTimes.length > 100) {
			this.responseTimes.shift();
		}
		
		this.metrics.averageResponseTime = 
			this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
	}
}