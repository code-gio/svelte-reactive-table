/**
 * Firebase-specific type definitions for svelte-reactive-table
 */

import type { DataRow } from '../../types/core/index.js';

/**
 * Firebase configuration interface
 */
export interface FirebaseConfig {
	/** Firebase app config */
	firebaseConfig: {
		apiKey: string;
		authDomain: string;
		projectId: string;
		storageBucket?: string;
		messagingSenderId?: string;
		appId: string;
		measurementId?: string;
	};
	
	/** Collection name in Firestore */
	collectionName: string;
	
	/** Subcollection path (optional) */
	subcollection?: string;
	
	/** Authentication required */
	requireAuth?: boolean;
	
	/** Real-time updates enabled */
	realtime?: boolean;
	
	/** Offline persistence */
	persistence?: boolean;
	
	/** Custom converter functions */
	converter?: FirebaseConverter<any>;
}

/**
 * Firebase converter interface for type safety
 */
export interface FirebaseConverter<T extends DataRow = DataRow> {
	/** Convert from Firestore data to app data */
	fromFirestore(data: any, id: string): T;
	
	/** Convert from app data to Firestore data */
	toFirestore(data: Partial<T>): any;
	
	/** Validate data before conversion */
	validate?(data: any): boolean;
	
	/** Transform data after conversion */
	transform?(data: T): T;
}

/**
 * Firebase query options
 */
export interface FirebaseQueryOptions {
	/** Where clauses */
	where?: FirebaseWhereClause[];
	
	/** Order by clauses */
	orderBy?: FirebaseOrderBy[];
	
	/** Limit results */
	limit?: number;
	
	/** Start after document */
	startAfter?: any;
	
	/** Start at document */
	startAt?: any;
	
	/** End before document */
	endBefore?: any;
	
	/** End at document */
	endAt?: any;
}

/**
 * Firebase where clause
 */
export interface FirebaseWhereClause {
	/** Field path */
	field: string;
	
	/** Operator */
	operator: FirebaseOperator;
	
	/** Value to compare */
	value: any;
}

/**
 * Firebase operators
 */
export type FirebaseOperator = 
	| '=='
	| '!='
	| '<'
	| '<='
	| '>'
	| '>='
	| 'array-contains'
	| 'array-contains-any'
	| 'in'
	| 'not-in';

/**
 * Firebase order by clause
 */
export interface FirebaseOrderBy {
	/** Field to order by */
	field: string;
	
	/** Direction */
	direction?: 'asc' | 'desc';
}

/**
 * Firebase document with metadata
 */
export interface FirebaseDocument<T extends DataRow = DataRow> {
	/** Document data */
	data: T;
	
	/** Document ID */
	id: string;
	
	/** Document metadata */
	metadata: {
		exists: boolean;
		fromCache: boolean;
		hasPendingWrites: boolean;
	};
	
	/** Document reference path */
	ref: string;
}

/**
 * Firebase batch operation
 */
export interface FirebaseBatchOperation<T extends DataRow = DataRow> {
	/** Operation type */
	type: 'create' | 'update' | 'delete';
	
	/** Document ID */
	id?: string;
	
	/** Document data (for create/update) */
	data?: Partial<T>;
	
	/** Document reference */
	ref?: string;
}

/**
 * Firebase transaction context
 */
export interface FirebaseTransaction {
	/** Get document */
	get(ref: any): Promise<any>;
	
	/** Set document */
	set(ref: any, data: any): FirebaseTransaction;
	
	/** Update document */
	update(ref: any, data: any): FirebaseTransaction;
	
	/** Delete document */
	delete(ref: any): FirebaseTransaction;
}

/**
 * Firebase error with code
 */
export interface FirebaseError extends Error {
	/** Firebase error code */
	code: string;
	
	/** Custom message */
	customData?: any;
	
	/** Stack trace */
	stack?: string;
}

/**
 * Firebase auth user
 */
export interface FirebaseUser {
	/** User ID */
	uid: string;
	
	/** Email */
	email?: string;
	
	/** Display name */
	displayName?: string;
	
	/** Photo URL */
	photoURL?: string;
	
	/** Email verified */
	emailVerified: boolean;
	
	/** Anonymous user */
	isAnonymous: boolean;
	
	/** Custom claims */
	customClaims?: Record<string, any>;
	
	/** Provider data */
	providerData: any[];
}

/**
 * Firebase auth state
 */
export interface FirebaseAuthState {
	/** Current user */
	user: FirebaseUser | null;
	
	/** Loading state */
	loading: boolean;
	
	/** Error state */
	error: string | null;
	
	/** Initialized */
	initialized: boolean;
}

/**
 * Firebase connection state
 */
export interface FirebaseConnectionState {
	/** Connected to Firestore */
	connected: boolean;
	
	/** Online state */
	online: boolean;
	
	/** Sync state */
	synced: boolean;
	
	/** Pending writes */
	pendingWrites: number;
	
	/** Last sync timestamp */
	lastSync?: Date;
}

/**
 * Firebase subscription info
 */
export interface FirebaseSubscription {
	/** Collection path */
	path: string;
	
	/** Query options */
	query?: FirebaseQueryOptions;
	
	/** Active subscription */
	active: boolean;
	
	/** Subscription timestamp */
	timestamp: Date;
	
	/** Document count */
	docCount: number;
	
	/** Error count */
	errorCount: number;
}

/**
 * Firebase performance metrics
 */
export interface FirebaseMetrics {
	/** Read operations */
	reads: number;
	
	/** Write operations */
	writes: number;
	
	/** Delete operations */
	deletes: number;
	
	/** Cache hits */
	cacheHits: number;
	
	/** Average latency (ms) */
	averageLatency: number;
	
	/** Error rate */
	errorRate: number;
	
	/** Data transfer (bytes) */
	dataTransfer: number;
}