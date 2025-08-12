/**
 * Virtual scrolling utilities for performance optimization
 * Handles large datasets efficiently by rendering only visible items
 */

import type { DataRow } from '../../types/core/index.js';

export interface VirtualScrollConfig {
	/** Fixed row height in pixels */
	rowHeight: number;
	
	/** Container height in pixels */
	containerHeight: number;
	
	/** Buffer size (extra items to render outside viewport) */
	buffer: number;
	
	/** Enable overscan (render items slightly outside viewport) */
	overscan: boolean;
	
	/** Overscan count */
	overscanCount: number;
	
	/** Dynamic row heights */
	dynamicHeight: boolean;
	
	/** Minimum row height for dynamic sizing */
	minRowHeight: number;
	
	/** Maximum row height for dynamic sizing */
	maxRowHeight: number;
	
	/** Scroll threshold for updates (pixels) */
	scrollThreshold: number;
}

export interface VirtualScrollState {
	/** Current scroll position */
	scrollTop: number;
	
	/** Visible range start index */
	startIndex: number;
	
	/** Visible range end index */
	endIndex: number;
	
	/** Total number of items */
	totalItems: number;
	
	/** Visible items count */
	visibleItems: number;
	
	/** Top offset for positioning */
	offsetTop: number;
	
	/** Bottom offset for positioning */
	offsetBottom: number;
	
	/** Total content height */
	totalHeight: number;
	
	/** Items currently being rendered */
	renderedItems: number[];
	
	/** Row height cache for dynamic heights */
	rowHeightCache: Map<number, number>;
}

export interface VirtualScrollItem<T = any> {
	/** Item index */
	index: number;
	
	/** Item data */
	data: T;
	
	/** Item height */
	height: number;
	
	/** Item top offset */
	top: number;
	
	/** Is item visible */
	visible: boolean;
}

/**
 * Virtual scroll manager using reactive patterns
 */
export class VirtualScrollManager<T extends DataRow = DataRow> {
	private config: VirtualScrollConfig;
	private state: VirtualScrollState;
	private data: T[] = [];
	
	constructor(config: Partial<VirtualScrollConfig> = {}) {
		this.config = {
			rowHeight: 48,
			containerHeight: 400,
			buffer: 5,
			overscan: true,
			overscanCount: 2,
			dynamicHeight: false,
			minRowHeight: 32,
			maxRowHeight: 200,
			scrollThreshold: 10,
			...config
		};
		
		this.state = {
			scrollTop: 0,
			startIndex: 0,
			endIndex: 0,
			totalItems: 0,
			visibleItems: 0,
			offsetTop: 0,
			offsetBottom: 0,
			totalHeight: 0,
			renderedItems: [],
			rowHeightCache: new Map()
		};
	}
	
	/**
	 * Initialize virtual scrolling with data
	 */
	initialize(data: T[]): void {
		this.data = data;
		this.state.totalItems = data.length;
		this.calculateDimensions();
		this.updateVisibleRange();
	}
	
	/**
	 * Update data and recalculate virtual scroll
	 */
	updateData(data: T[]): void {
		const oldLength = this.data.length;
		this.data = data;
		this.state.totalItems = data.length;
		
		// Clear height cache if data length changed significantly
		if (Math.abs(data.length - oldLength) > 100) {
			this.state.rowHeightCache.clear();
		}
		
		this.calculateDimensions();
		this.updateVisibleRange();
	}
	
	/**
	 * Handle scroll event
	 */
	handleScroll(scrollTop: number): void {
		// Only update if scroll change is significant
		if (Math.abs(scrollTop - this.state.scrollTop) < this.config.scrollThreshold) {
			return;
		}
		
		this.state.scrollTop = scrollTop;
		this.updateVisibleRange();
	}
	
	/**
	 * Update container height
	 */
	updateContainerHeight(height: number): void {
		this.config.containerHeight = height;
		this.calculateDimensions();
		this.updateVisibleRange();
	}
	
	/**
	 * Set row height for specific item (dynamic heights)
	 */
	setRowHeight(index: number, height: number): void {
		if (!this.config.dynamicHeight) return;
		
		// Clamp height to configured bounds
		const clampedHeight = Math.max(
			this.config.minRowHeight,
			Math.min(this.config.maxRowHeight, height)
		);
		
		// Only update if height changed significantly
		const currentHeight = this.state.rowHeightCache.get(index);
		if (currentHeight && Math.abs(currentHeight - clampedHeight) < 2) {
			return;
		}
		
		this.state.rowHeightCache.set(index, clampedHeight);
		this.calculateDimensions();
		this.updateVisibleRange();
	}
	
	/**
	 * Calculate total dimensions
	 */
	private calculateDimensions(): void {
		if (this.config.dynamicHeight) {
			// Calculate total height from cached heights
			let totalHeight = 0;
			for (let i = 0; i < this.state.totalItems; i++) {
				const cachedHeight = this.state.rowHeightCache.get(i);
				totalHeight += cachedHeight || this.config.rowHeight;
			}
			this.state.totalHeight = totalHeight;
		} else {
			// Fixed height calculation
			this.state.totalHeight = this.state.totalItems * this.config.rowHeight;
		}
		
		// Calculate visible items count
		this.state.visibleItems = Math.ceil(
			this.config.containerHeight / this.config.rowHeight
		);
	}
	
	/**
	 * Update visible range based on scroll position
	 */
	private updateVisibleRange(): void {
		if (this.state.totalItems === 0) {
			this.state.startIndex = 0;
			this.state.endIndex = 0;
			this.state.offsetTop = 0;
			this.state.offsetBottom = 0;
			this.state.renderedItems = [];
			return;
		}
		
		let startIndex: number;
		let offsetTop = 0;
		
		if (this.config.dynamicHeight) {
			// Find start index for dynamic heights
			startIndex = this.findStartIndexForDynamicHeight();
			
			// Calculate offset top
			for (let i = 0; i < startIndex; i++) {
				const height = this.state.rowHeightCache.get(i) || this.config.rowHeight;
				offsetTop += height;
			}
		} else {
			// Fixed height calculation
			startIndex = Math.floor(this.state.scrollTop / this.config.rowHeight);
			offsetTop = startIndex * this.config.rowHeight;
		}
		
		// Add buffer and overscan
		const bufferedStartIndex = Math.max(0, startIndex - this.config.buffer);
		let endIndex = startIndex + this.state.visibleItems + this.config.buffer;
		
		if (this.config.overscan) {
			endIndex += this.config.overscanCount;
		}
		
		endIndex = Math.min(this.state.totalItems, endIndex);
		
		// Calculate offset bottom
		let offsetBottom = 0;
		if (this.config.dynamicHeight) {
			for (let i = endIndex; i < this.state.totalItems; i++) {
				const height = this.state.rowHeightCache.get(i) || this.config.rowHeight;
				offsetBottom += height;
			}
		} else {
			offsetBottom = (this.state.totalItems - endIndex) * this.config.rowHeight;
		}
		
		// Update state
		this.state.startIndex = bufferedStartIndex;
		this.state.endIndex = endIndex;
		this.state.offsetTop = offsetTop - (bufferedStartIndex !== startIndex ? 
			(startIndex - bufferedStartIndex) * this.config.rowHeight : 0);
		this.state.offsetBottom = offsetBottom;
		this.state.renderedItems = this.generateRenderedItems();
	}
	
	/**
	 * Find start index for dynamic heights using binary search
	 */
	private findStartIndexForDynamicHeight(): number {
		let left = 0;
		let right = this.state.totalItems - 1;
		let accumulatedHeight = 0;
		
		while (left < right) {
			const mid = Math.floor((left + right) / 2);
			accumulatedHeight = 0;
			
			// Calculate height up to mid
			for (let i = 0; i <= mid; i++) {
				const height = this.state.rowHeightCache.get(i) || this.config.rowHeight;
				accumulatedHeight += height;
			}
			
			if (accumulatedHeight < this.state.scrollTop) {
				left = mid + 1;
			} else {
				right = mid;
			}
		}
		
		return left;
	}
	
	/**
	 * Generate list of items to render
	 */
	private generateRenderedItems(): number[] {
		const items: number[] = [];
		for (let i = this.state.startIndex; i < this.state.endIndex; i++) {
			items.push(i);
		}
		return items;
	}
	
	/**
	 * Get virtual item data for rendering
	 */
	getVirtualItems(): VirtualScrollItem<T>[] {
		const items: VirtualScrollItem<T>[] = [];
		let currentTop = this.state.offsetTop;
		
		for (const index of this.state.renderedItems) {
			if (index >= this.data.length) continue;
			
			const height = this.config.dynamicHeight 
				? (this.state.rowHeightCache.get(index) || this.config.rowHeight)
				: this.config.rowHeight;
			
			const item: VirtualScrollItem<T> = {
				index,
				data: this.data[index],
				height,
				top: currentTop,
				visible: this.isItemVisible(index, currentTop, height)
			};
			
			items.push(item);
			currentTop += height;
		}
		
		return items;
	}
	
	/**
	 * Check if item is visible in viewport
	 */
	private isItemVisible(index: number, top: number, height: number): boolean {
		const itemBottom = top + height;
		const viewportBottom = this.state.scrollTop + this.config.containerHeight;
		
		return itemBottom > this.state.scrollTop && top < viewportBottom;
	}
	
	/**
	 * Scroll to specific index
	 */
	scrollToIndex(index: number, alignment: 'start' | 'center' | 'end' | 'auto' = 'auto'): number {
		if (index < 0 || index >= this.state.totalItems) {
			return this.state.scrollTop;
		}
		
		let targetScrollTop: number;
		
		if (this.config.dynamicHeight) {
			// Calculate position for dynamic heights
			let accumulatedHeight = 0;
			for (let i = 0; i < index; i++) {
				const height = this.state.rowHeightCache.get(i) || this.config.rowHeight;
				accumulatedHeight += height;
			}
			
			const itemHeight = this.state.rowHeightCache.get(index) || this.config.rowHeight;
			
			switch (alignment) {
				case 'start':
					targetScrollTop = accumulatedHeight;
					break;
				case 'center':
					targetScrollTop = accumulatedHeight - (this.config.containerHeight / 2) + (itemHeight / 2);
					break;
				case 'end':
					targetScrollTop = accumulatedHeight + itemHeight - this.config.containerHeight;
					break;
				case 'auto':
				default:
					// Only scroll if item is not visible
					const itemTop = accumulatedHeight;
					const itemBottom = itemTop + itemHeight;
					const viewportTop = this.state.scrollTop;
					const viewportBottom = viewportTop + this.config.containerHeight;
					
					if (itemTop < viewportTop) {
						targetScrollTop = itemTop;
					} else if (itemBottom > viewportBottom) {
						targetScrollTop = itemBottom - this.config.containerHeight;
					} else {
						return this.state.scrollTop; // Already visible
					}
					break;
			}
		} else {
			// Fixed height calculation
			const itemTop = index * this.config.rowHeight;
			
			switch (alignment) {
				case 'start':
					targetScrollTop = itemTop;
					break;
				case 'center':
					targetScrollTop = itemTop - (this.config.containerHeight / 2) + (this.config.rowHeight / 2);
					break;
				case 'end':
					targetScrollTop = itemTop + this.config.rowHeight - this.config.containerHeight;
					break;
				case 'auto':
				default:
					const itemBottom = itemTop + this.config.rowHeight;
					const viewportTop = this.state.scrollTop;
					const viewportBottom = viewportTop + this.config.containerHeight;
					
					if (itemTop < viewportTop) {
						targetScrollTop = itemTop;
					} else if (itemBottom > viewportBottom) {
						targetScrollTop = itemBottom - this.config.containerHeight;
					} else {
						return this.state.scrollTop; // Already visible
					}
					break;
			}
		}
		
		// Clamp scroll position
		targetScrollTop = Math.max(0, Math.min(
			this.state.totalHeight - this.config.containerHeight,
			targetScrollTop
		));
		
		return targetScrollTop;
	}
	
	/**
	 * Get current virtual scroll state
	 */
	getState(): Readonly<VirtualScrollState> {
		return { ...this.state };
	}
	
	/**
	 * Get configuration
	 */
	getConfig(): Readonly<VirtualScrollConfig> {
		return { ...this.config };
	}
	
	/**
	 * Update configuration
	 */
	updateConfig(updates: Partial<VirtualScrollConfig>): void {
		this.config = { ...this.config, ...updates };
		this.calculateDimensions();
		this.updateVisibleRange();
	}
	
	/**
	 * Reset virtual scroll state
	 */
	reset(): void {
		this.state.scrollTop = 0;
		this.state.rowHeightCache.clear();
		this.calculateDimensions();
		this.updateVisibleRange();
	}
	
	/**
	 * Get performance metrics
	 */
	getMetrics(): {
		totalItems: number;
		renderedItems: number;
		renderRatio: number;
		memoryUsage: number;
		cacheSize: number;
	} {
		const renderedCount = this.state.renderedItems.length;
		const renderRatio = this.state.totalItems > 0 ? renderedCount / this.state.totalItems : 0;
		
		return {
			totalItems: this.state.totalItems,
			renderedItems: renderedCount,
			renderRatio,
			memoryUsage: renderedCount * 64, // Rough estimate in bytes
			cacheSize: this.state.rowHeightCache.size
		};
	}
}