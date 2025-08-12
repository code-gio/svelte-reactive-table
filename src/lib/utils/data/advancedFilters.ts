/**
 * Advanced filtering utilities for svelte-reactive-table
 * Provides complex filtering, search, and query building capabilities
 */

import type { DataRow, TableFilter } from '../../types/core/index.js';

export interface AdvancedFilterConfig {
	/** Enable case-sensitive filtering */
	caseSensitive: boolean;
	
	/** Enable fuzzy matching */
	fuzzyMatching: boolean;
	
	/** Fuzzy threshold (0-1) */
	fuzzyThreshold: number;
	
	/** Enable regex support */
	regexSupport: boolean;
	
	/** Default operator for text searches */
	defaultTextOperator: 'contains' | 'startsWith' | 'endsWith' | 'equals';
	
	/** Enable date range parsing */
	dateRangeParsing: boolean;
	
	/** Enable numerical range parsing */
	numericalRangeParsing: boolean;
}

export interface SearchQuery {
	/** Search term */
	query: string;
	
	/** Fields to search in */
	fields?: string[];
	
	/** Search operator */
	operator: 'and' | 'or';
	
	/** Search options */
	options: {
		caseSensitive: boolean;
		fuzzyMatching: boolean;
		wholeWord: boolean;
		regex: boolean;
	};
}

export interface FilterGroup {
	/** Group ID */
	id: string;
	
	/** Group name */
	name: string;
	
	/** Filters in this group */
	filters: TableFilter[];
	
	/** Logical operator between filters in group */
	operator: 'and' | 'or';
	
	/** Group enabled status */
	enabled: boolean;
}

export interface FilterExpression {
	/** Expression type */
	type: 'filter' | 'group' | 'operator';
	
	/** Filter (for type: 'filter') */
	filter?: TableFilter;
	
	/** Group (for type: 'group') */
	group?: FilterGroup;
	
	/** Operator (for type: 'operator') */
	operator?: 'and' | 'or' | 'not';
	
	/** Child expressions */
	children?: FilterExpression[];
}

/**
 * Advanced filter manager
 */
export class AdvancedFilterManager<T extends DataRow = DataRow> {
	private config: AdvancedFilterConfig;
	private filterGroups = new Map<string, FilterGroup>();
	private globalFilters: TableFilter[] = [];
	
	constructor(config: Partial<AdvancedFilterConfig> = {}) {
		this.config = {
			caseSensitive: false,
			fuzzyMatching: false,
			fuzzyThreshold: 0.8,
			regexSupport: false,
			defaultTextOperator: 'contains',
			dateRangeParsing: true,
			numericalRangeParsing: true,
			...config
		};
	}
	
	/**
	 * Apply all filters to data
	 */
	filterData(data: T[], searchQuery?: SearchQuery): T[] {
		let filtered = [...data];
		
		// Apply global filters
		if (this.globalFilters.length > 0) {
			filtered = filtered.filter(row => 
				this.evaluateFilters(row, this.globalFilters)
			);
		}
		
		// Apply filter groups
		for (const group of this.filterGroups.values()) {
			if (group.enabled && group.filters.length > 0) {
				filtered = filtered.filter(row => 
					this.evaluateFilters(row, group.filters, group.operator)
				);
			}
		}
		
		// Apply search query
		if (searchQuery && searchQuery.query.trim()) {
			filtered = this.applySearch(filtered, searchQuery);
		}
		
		return filtered;
	}
	
	/**
	 * Add global filter
	 */
	addGlobalFilter(filter: TableFilter): void {
		this.globalFilters.push(filter);
	}
	
	/**
	 * Remove global filter
	 */
	removeGlobalFilter(index: number): void {
		this.globalFilters.splice(index, 1);
	}
	
	/**
	 * Clear all global filters
	 */
	clearGlobalFilters(): void {
		this.globalFilters = [];
	}
	
	/**
	 * Get global filters
	 */
	getGlobalFilters(): TableFilter[] {
		return [...this.globalFilters];
	}
	
	/**
	 * Create filter group
	 */
	createFilterGroup(name: string, operator: 'and' | 'or' = 'and'): string {
		const id = this.generateId();
		const group: FilterGroup = {
			id,
			name,
			filters: [],
			operator,
			enabled: true
		};
		
		this.filterGroups.set(id, group);
		return id;
	}
	
	/**
	 * Add filter to group
	 */
	addFilterToGroup(groupId: string, filter: TableFilter): void {
		const group = this.filterGroups.get(groupId);
		if (group) {
			group.filters.push(filter);
		}
	}
	
	/**
	 * Remove filter from group
	 */
	removeFilterFromGroup(groupId: string, filterIndex: number): void {
		const group = this.filterGroups.get(groupId);
		if (group) {
			group.filters.splice(filterIndex, 1);
		}
	}
	
	/**
	 * Enable/disable filter group
	 */
	setGroupEnabled(groupId: string, enabled: boolean): void {
		const group = this.filterGroups.get(groupId);
		if (group) {
			group.enabled = enabled;
		}
	}
	
	/**
	 * Delete filter group
	 */
	deleteFilterGroup(groupId: string): void {
		this.filterGroups.delete(groupId);
	}
	
	/**
	 * Get all filter groups
	 */
	getFilterGroups(): FilterGroup[] {
		return Array.from(this.filterGroups.values());
	}
	
	/**
	 * Parse smart filter query
	 * Examples: 
	 * - "name:John age:>25"
	 * - "status:active OR priority:high"
	 * - "created:>2023-01-01 AND (status:pending OR status:review)"
	 */
	parseSmartQuery(query: string): TableFilter[] {
		const filters: TableFilter[] = [];
		
		// Split by logical operators while preserving them
		const tokens = this.tokenizeQuery(query);
		
		for (const token of tokens) {
			if (this.isLogicalOperator(token)) {
				continue; // Skip logical operators for now
			}
			
			const filter = this.parseFilterToken(token);
			if (filter) {
				filters.push(filter);
			}
		}
		
		return filters;
	}
	
	/**
	 * Build filter expression tree from query
	 */
	buildFilterExpression(query: string): FilterExpression | null {
		const tokens = this.tokenizeQuery(query);
		return this.parseExpression(tokens);
	}
	
	/**
	 * Apply search query to data
	 */
	private applySearch(data: T[], searchQuery: SearchQuery): T[] {
		const { query, fields, operator, options } = searchQuery;
		const searchTerms = this.parseSearchTerms(query);
		
		return data.filter(row => {
			const searchFields = fields || Object.keys(row);
			const matches = searchFields.map(field => {
				const value = this.getFieldValue(row, field);
				return this.matchSearchTerms(value, searchTerms, options);
			});
			
			return operator === 'and' 
				? matches.every(Boolean)
				: matches.some(Boolean);
		});
	}
	
	/**
	 * Evaluate filters against a row
	 */
	private evaluateFilters(
		row: T, 
		filters: TableFilter[], 
		operator: 'and' | 'or' = 'and'
	): boolean {
		if (filters.length === 0) return true;
		
		const results = filters.map(filter => this.evaluateFilter(row, filter));
		
		return operator === 'and' 
			? results.every(Boolean)
			: results.some(Boolean);
	}
	
	/**
	 * Evaluate single filter against a row
	 */
	private evaluateFilter(row: T, filter: TableFilter): boolean {
		const fieldValue = this.getFieldValue(row, filter.column);
		const filterValue = filter.value;
		
		// Handle null values
		if (fieldValue == null) {
			return filter.operator === 'isNull' || 
				   (filter.operator === 'equals' && filterValue == null);
		}
		
		if (filterValue == null && filter.operator !== 'isNull' && filter.operator !== 'isNotNull') {
			return false;
		}
		
		switch (filter.operator) {
			case 'equals':
				return this.compareValues(fieldValue, filterValue, 'equals');
				
			case 'notEquals':
				return !this.compareValues(fieldValue, filterValue, 'equals');
				
			case 'contains':
				return this.compareValues(fieldValue, filterValue, 'contains');
				
			case 'notContains':
				return !this.compareValues(fieldValue, filterValue, 'contains');
				
			case 'startsWith':
				return this.compareValues(fieldValue, filterValue, 'startsWith');
				
			case 'endsWith':
				return this.compareValues(fieldValue, filterValue, 'endsWith');
				
			case 'greaterThan':
				return this.compareValues(fieldValue, filterValue, 'greaterThan');
				
			case 'greaterThanOrEqual':
				return this.compareValues(fieldValue, filterValue, 'greaterThanOrEqual');
				
			case 'lessThan':
				return this.compareValues(fieldValue, filterValue, 'lessThan');
				
			case 'lessThanOrEqual':
				return this.compareValues(fieldValue, filterValue, 'lessThanOrEqual');
				
			case 'in':
				return Array.isArray(filterValue) && 
					   filterValue.some(val => this.compareValues(fieldValue, val, 'equals'));
				
			case 'notIn':
				return Array.isArray(filterValue) && 
					   !filterValue.some(val => this.compareValues(fieldValue, val, 'equals'));
				
			case 'between':
				return Array.isArray(filterValue) && filterValue.length === 2 &&
					   this.compareValues(fieldValue, filterValue[0], 'greaterThanOrEqual') &&
					   this.compareValues(fieldValue, filterValue[1], 'lessThanOrEqual');
				
			case 'isNull':
				return fieldValue == null;
				
			case 'isNotNull':
				return fieldValue != null;
				
			case 'isEmpty':
				return fieldValue === '' || fieldValue == null;
				
			case 'isNotEmpty':
				return fieldValue !== '' && fieldValue != null;
				
			case 'regex':
				if (this.config.regexSupport && typeof filterValue === 'string') {
					try {
						const regex = new RegExp(filterValue, this.config.caseSensitive ? 'g' : 'gi');
						return regex.test(String(fieldValue));
					} catch {
						return false;
					}
				}
				return false;
				
			default:
				return false;
		}
	}
	
	/**
	 * Compare two values based on operator
	 */
	private compareValues(fieldValue: any, filterValue: any, operator: string): boolean {
		// Convert to appropriate types
		const field = this.normalizeValue(fieldValue);
		const filter = this.normalizeValue(filterValue);
		
		switch (operator) {
			case 'equals':
				if (this.config.fuzzyMatching && typeof field === 'string' && typeof filter === 'string') {
					return this.fuzzyMatch(field, filter);
				}
				return field === filter;
				
			case 'contains':
				if (typeof field === 'string' && typeof filter === 'string') {
					const fieldStr = this.config.caseSensitive ? field : field.toLowerCase();
					const filterStr = this.config.caseSensitive ? filter : filter.toLowerCase();
					return fieldStr.includes(filterStr);
				}
				return false;
				
			case 'startsWith':
				if (typeof field === 'string' && typeof filter === 'string') {
					const fieldStr = this.config.caseSensitive ? field : field.toLowerCase();
					const filterStr = this.config.caseSensitive ? filter : filter.toLowerCase();
					return fieldStr.startsWith(filterStr);
				}
				return false;
				
			case 'endsWith':
				if (typeof field === 'string' && typeof filter === 'string') {
					const fieldStr = this.config.caseSensitive ? field : field.toLowerCase();
					const filterStr = this.config.caseSensitive ? filter : filter.toLowerCase();
					return fieldStr.endsWith(filterStr);
				}
				return false;
				
			case 'greaterThan':
				return this.compareNumerically(field, filter) > 0;
				
			case 'greaterThanOrEqual':
				return this.compareNumerically(field, filter) >= 0;
				
			case 'lessThan':
				return this.compareNumerically(field, filter) < 0;
				
			case 'lessThanOrEqual':
				return this.compareNumerically(field, filter) <= 0;
				
			default:
				return false;
		}
	}
	
	/**
	 * Normalize value for comparison
	 */
	private normalizeValue(value: any): any {
		if (value == null) return value;
		
		// Try to parse as date
		if (typeof value === 'string' && this.config.dateRangeParsing) {
			const date = new Date(value);
			if (!isNaN(date.getTime())) {
				return date;
			}
		}
		
		// Try to parse as number
		if (typeof value === 'string' && this.config.numericalRangeParsing) {
			const num = Number(value);
			if (!isNaN(num)) {
				return num;
			}
		}
		
		return value;
	}
	
	/**
	 * Compare values numerically (supports dates)
	 */
	private compareNumerically(a: any, b: any): number {
		if (a instanceof Date && b instanceof Date) {
			return a.getTime() - b.getTime();
		}
		
		if (typeof a === 'number' && typeof b === 'number') {
			return a - b;
		}
		
		// Fall back to string comparison
		return String(a).localeCompare(String(b));
	}
	
	/**
	 * Fuzzy string matching using Levenshtein distance
	 */
	private fuzzyMatch(str1: string, str2: string): boolean {
		const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
		const maxLength = Math.max(str1.length, str2.length);
		const similarity = 1 - (distance / maxLength);
		
		return similarity >= this.config.fuzzyThreshold;
	}
	
	/**
	 * Calculate Levenshtein distance between two strings
	 */
	private levenshteinDistance(str1: string, str2: string): number {
		const matrix = Array(str2.length + 1).fill(null).map(() => 
			Array(str1.length + 1).fill(null)
		);
		
		for (let i = 0; i <= str1.length; i++) {
			matrix[0][i] = i;
		}
		
		for (let j = 0; j <= str2.length; j++) {
			matrix[j][0] = j;
		}
		
		for (let j = 1; j <= str2.length; j++) {
			for (let i = 1; i <= str1.length; i++) {
				if (str1[i - 1] === str2[j - 1]) {
					matrix[j][i] = matrix[j - 1][i - 1];
				} else {
					matrix[j][i] = Math.min(
						matrix[j - 1][i - 1] + 1, // substitution
						matrix[j][i - 1] + 1,     // insertion
						matrix[j - 1][i] + 1      // deletion
					);
				}
			}
		}
		
		return matrix[str2.length][str1.length];
	}
	
	/**
	 * Get field value from row (supports nested properties)
	 */
	private getFieldValue(row: T, field: string): any {
		return field.split('.').reduce((obj, key) => obj?.[key], row as any);
	}
	
	/**
	 * Parse search terms from query
	 */
	private parseSearchTerms(query: string): string[] {
		// Split by spaces but preserve quoted strings
		const terms: string[] = [];
		const regex = /"([^"]+)"|(\S+)/g;
		let match;
		
		while ((match = regex.exec(query)) !== null) {
			terms.push(match[1] || match[2]);
		}
		
		return terms;
	}
	
	/**
	 * Match search terms against value
	 */
	private matchSearchTerms(
		value: any, 
		terms: string[], 
		options: SearchQuery['options']
	): boolean {
		if (value == null) return false;
		
		const valueStr = String(value);
		const searchStr = options.caseSensitive ? valueStr : valueStr.toLowerCase();
		
		for (const term of terms) {
			const searchTerm = options.caseSensitive ? term : term.toLowerCase();
			
			if (options.regex) {
				try {
					const regex = new RegExp(searchTerm, options.caseSensitive ? 'g' : 'gi');
					if (regex.test(searchStr)) return true;
				} catch {
					// Fall back to string search if regex is invalid
				}
			}
			
			if (options.fuzzyMatching) {
				if (this.fuzzyMatch(searchStr, searchTerm)) return true;
			}
			
			if (options.wholeWord) {
				const regex = new RegExp(`\\b${searchTerm}\\b`, options.caseSensitive ? 'g' : 'gi');
				if (regex.test(searchStr)) return true;
			} else {
				if (searchStr.includes(searchTerm)) return true;
			}
		}
		
		return false;
	}
	
	/**
	 * Tokenize query string
	 */
	private tokenizeQuery(query: string): string[] {
		// Split by logical operators while preserving them
		const tokens = query.split(/(\s+(?:AND|OR|NOT)\s+)/i);
		return tokens.filter(token => token.trim().length > 0);
	}
	
	/**
	 * Check if token is a logical operator
	 */
	private isLogicalOperator(token: string): boolean {
		return /^\s*(?:AND|OR|NOT)\s*$/i.test(token);
	}
	
	/**
	 * Parse filter token (e.g., "name:John", "age:>25")
	 */
	private parseFilterToken(token: string): TableFilter | null {
		const match = token.match(/^(\w+):(.*?)$/);
		if (!match) return null;
		
		const [, column, valueStr] = match;
		let operator = 'equals';
		let value: any = valueStr;
		
		// Parse operators
		if (valueStr.startsWith('>=')) {
			operator = 'greaterThanOrEqual';
			value = valueStr.substring(2);
		} else if (valueStr.startsWith('<=')) {
			operator = 'lessThanOrEqual';
			value = valueStr.substring(2);
		} else if (valueStr.startsWith('>')) {
			operator = 'greaterThan';
			value = valueStr.substring(1);
		} else if (valueStr.startsWith('<')) {
			operator = 'lessThan';
			value = valueStr.substring(1);
		} else if (valueStr.startsWith('!=')) {
			operator = 'notEquals';
			value = valueStr.substring(2);
		} else if (valueStr.startsWith('*') && valueStr.endsWith('*')) {
			operator = 'contains';
			value = valueStr.slice(1, -1);
		} else if (valueStr.startsWith('*')) {
			operator = 'endsWith';
			value = valueStr.substring(1);
		} else if (valueStr.endsWith('*')) {
			operator = 'startsWith';
			value = valueStr.slice(0, -1);
		}
		
		// Parse value
		value = this.parseValue(value);
		
		return {
			column,
			operator: operator as any,
			value
		};
	}
	
	/**
	 * Parse expression tree from tokens
	 */
	private parseExpression(tokens: string[]): FilterExpression | null {
		// Simple implementation - could be expanded for complex expressions
		const filters = tokens
			.filter(token => !this.isLogicalOperator(token))
			.map(token => this.parseFilterToken(token))
			.filter(Boolean) as TableFilter[];
		
		if (filters.length === 0) return null;
		
		return {
			type: 'group',
			group: {
				id: this.generateId(),
				name: 'Parsed Query',
				filters,
				operator: 'and',
				enabled: true
			}
		};
	}
	
	/**
	 * Parse value from string
	 */
	private parseValue(valueStr: string): any {
		// Remove quotes
		if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
			return valueStr.slice(1, -1);
		}
		
		// Parse boolean
		if (valueStr === 'true') return true;
		if (valueStr === 'false') return false;
		
		// Parse null
		if (valueStr === 'null') return null;
		
		// Parse number
		const num = Number(valueStr);
		if (!isNaN(num)) return num;
		
		// Parse date
		const date = new Date(valueStr);
		if (!isNaN(date.getTime())) return date;
		
		return valueStr;
	}
	
	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `filter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}
	
	/**
	 * Export filters as JSON
	 */
	exportFilters(): string {
		return JSON.stringify({
			globalFilters: this.globalFilters,
			filterGroups: Array.from(this.filterGroups.values()),
			config: this.config
		});
	}
	
	/**
	 * Import filters from JSON
	 */
	importFilters(json: string): void {
		try {
			const data = JSON.parse(json);
			
			this.globalFilters = data.globalFilters || [];
			this.filterGroups.clear();
			
			if (data.filterGroups) {
				for (const group of data.filterGroups) {
					this.filterGroups.set(group.id, group);
				}
			}
			
			if (data.config) {
				this.config = { ...this.config, ...data.config };
			}
		} catch (error) {
			throw new Error('Invalid filter export format');
		}
	}
}