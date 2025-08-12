/**
 * Data export utilities for svelte-reactive-table
 * Supports multiple export formats with customizable options
 */

import type { DataRow, ColumnDefinition } from '../../types/core/index.js';

export interface ExportConfig {
	/** Export format */
	format: ExportFormat;
	
	/** File name (without extension) */
	filename: string;
	
	/** Columns to include (if not specified, all visible columns) */
	columns?: string[];
	
	/** Include headers */
	includeHeaders: boolean;
	
	/** Date format for date columns */
	dateFormat: string;
	
	/** Number format options */
	numberFormat: {
		locale: string;
		minimumFractionDigits?: number;
		maximumFractionDigits?: number;
	};
	
	/** Custom formatters */
	formatters?: Record<string, (value: any, row: DataRow) => string>;
	
	/** Encoding for text formats */
	encoding: 'utf-8' | 'utf-16' | 'ascii';
}

export interface CSVConfig extends ExportConfig {
	format: 'csv';
	
	/** Field delimiter */
	delimiter: string;
	
	/** Text qualifier */
	qualifier: string;
	
	/** Line separator */
	lineSeparator: string;
	
	/** Escape quotes */
	escapeQuotes: boolean;
}

export interface ExcelConfig extends ExportConfig {
	format: 'excel';
	
	/** Sheet name */
	sheetName: string;
	
	/** Include formatting */
	includeFormatting: boolean;
	
	/** Auto-size columns */
	autoSizeColumns: boolean;
	
	/** Freeze header row */
	freezeHeader: boolean;
}

export interface JSONConfig extends ExportConfig {
	format: 'json';
	
	/** Pretty print JSON */
	prettyPrint: boolean;
	
	/** Indent size for pretty print */
	indent: number;
}

export interface PDFConfig extends ExportConfig {
	format: 'pdf';
	
	/** Page orientation */
	orientation: 'portrait' | 'landscape';
	
	/** Page size */
	pageSize: 'A4' | 'Letter' | 'Legal';
	
	/** Font size */
	fontSize: number;
	
	/** Include page numbers */
	includePageNumbers: boolean;
	
	/** Table title */
	title?: string;
}

export type ExportFormat = 'csv' | 'excel' | 'json' | 'pdf' | 'xml' | 'yaml';

export interface ExportResult {
	/** Generated file content */
	content: string | Uint8Array;
	
	/** File name with extension */
	filename: string;
	
	/** MIME type */
	mimeType: string;
	
	/** File size in bytes */
	size: number;
	
	/** Export metadata */
	metadata: {
		rowCount: number;
		columnCount: number;
		exportDate: Date;
		format: ExportFormat;
	};
}

/**
 * Data exporter with multiple format support
 */
export class DataExporter<T extends DataRow = DataRow> {
	/**
	 * Export data to specified format
	 */
	async export(
		data: T[],
		columns: ColumnDefinition[],
		config: ExportConfig
	): Promise<ExportResult> {
		// Validate inputs
		this.validateInputs(data, columns, config);
		
		// Filter columns if specified
		const exportColumns = this.filterColumns(columns, config.columns);
		
		// Apply formatters to data
		const formattedData = this.formatData(data, exportColumns, config);
		
		// Export based on format
		switch (config.format) {
			case 'csv':
				return this.exportCSV(formattedData, exportColumns, config as CSVConfig);
			case 'excel':
				return this.exportExcel(formattedData, exportColumns, config as ExcelConfig);
			case 'json':
				return this.exportJSON(formattedData, exportColumns, config as JSONConfig);
			case 'pdf':
				return this.exportPDF(formattedData, exportColumns, config as PDFConfig);
			case 'xml':
				return this.exportXML(formattedData, exportColumns, config);
			case 'yaml':
				return this.exportYAML(formattedData, exportColumns, config);
			default:
				throw new Error(`Unsupported export format: ${config.format}`);
		}
	}
	
	/**
	 * Export as CSV
	 */
	private async exportCSV(
		data: T[],
		columns: ColumnDefinition[],
		config: CSVConfig
	): Promise<ExportResult> {
		const lines: string[] = [];
		
		// Add headers if requested
		if (config.includeHeaders) {
			const headers = columns.map(col => 
				this.escapeCSVField(col.header, config)
			);
			lines.push(headers.join(config.delimiter));
		}
		
		// Add data rows
		for (const row of data) {
			const fields = columns.map(col => {
				const value = row[String(col.id)];
				const formatted = this.formatValue(value, col, config);
				return this.escapeCSVField(formatted, config);
			});
			lines.push(fields.join(config.delimiter));
		}
		
		const content = lines.join(config.lineSeparator);
		const filename = `${config.filename}.csv`;
		
		return {
			content,
			filename,
			mimeType: 'text/csv',
			size: new Blob([content]).size,
			metadata: {
				rowCount: data.length,
				columnCount: columns.length,
				exportDate: new Date(),
				format: 'csv'
			}
		};
	}
	
	/**
	 * Export as Excel (simplified - would need a library like SheetJS)
	 */
	private async exportExcel(
		data: T[],
		columns: ColumnDefinition[],
		config: ExcelConfig
	): Promise<ExportResult> {
		// This is a simplified implementation
		// In a real implementation, you'd use a library like SheetJS
		
		const rows: any[][] = [];
		
		// Add headers
		if (config.includeHeaders) {
			rows.push(columns.map(col => col.header));
		}
		
		// Add data
		for (const row of data) {
			const rowData = columns.map(col => {
				const value = row[String(col.id)];
				return this.convertValueForExcel(value, col);
			});
			rows.push(rowData);
		}
		
		// Convert to tab-delimited format as a simple Excel approximation
		const content = rows
			.map(row => row.map(cell => String(cell || '')).join('\t'))
			.join('\n');
		
		const filename = `${config.filename}.xlsx`;
		
		return {
			content,
			filename,
			mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			size: new Blob([content]).size,
			metadata: {
				rowCount: data.length,
				columnCount: columns.length,
				exportDate: new Date(),
				format: 'excel'
			}
		};
	}
	
	/**
	 * Export as JSON
	 */
	private async exportJSON(
		data: T[],
		columns: ColumnDefinition[],
		config: JSONConfig
	): Promise<ExportResult> {
		// Filter data to include only specified columns
		const filteredData = data.map(row => {
			const filtered: any = {};
			for (const col of columns) {
				const key = String(col.id);
				const value = row[key];
				filtered[key] = this.convertValueForJSON(value, col);
			}
			return filtered;
		});
		
		const content = config.prettyPrint
			? JSON.stringify(filteredData, null, config.indent)
			: JSON.stringify(filteredData);
		
		const filename = `${config.filename}.json`;
		
		return {
			content,
			filename,
			mimeType: 'application/json',
			size: new Blob([content]).size,
			metadata: {
				rowCount: data.length,
				columnCount: columns.length,
				exportDate: new Date(),
				format: 'json'
			}
		};
	}
	
	/**
	 * Export as PDF (simplified - would need a library like jsPDF)
	 */
	private async exportPDF(
		data: T[],
		columns: ColumnDefinition[],
		config: PDFConfig
	): Promise<ExportResult> {
		// This is a simplified implementation
		// In a real implementation, you'd use a library like jsPDF or Puppeteer
		
		let content = '';
		
		// Add title if specified
		if (config.title) {
			content += `${config.title}\n\n`;
		}
		
		// Add headers
		if (config.includeHeaders) {
			content += columns.map(col => col.header).join('\t') + '\n';
			content += columns.map(() => '---').join('\t') + '\n';
		}
		
		// Add data rows
		for (const row of data) {
			const fields = columns.map(col => {
				const value = row[String(col.id)];
				return this.formatValue(value, col, config);
			});
			content += fields.join('\t') + '\n';
		}
		
		const filename = `${config.filename}.pdf`;
		
		return {
			content,
			filename,
			mimeType: 'application/pdf',
			size: new Blob([content]).size,
			metadata: {
				rowCount: data.length,
				columnCount: columns.length,
				exportDate: new Date(),
				format: 'pdf'
			}
		};
	}
	
	/**
	 * Export as XML
	 */
	private async exportXML(
		data: T[],
		columns: ColumnDefinition[],
		config: ExportConfig
	): Promise<ExportResult> {
		let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
		xml += '<data>\n';
		
		for (const row of data) {
			xml += '  <row>\n';
			for (const col of columns) {
				const key = String(col.id);
				const value = row[key];
				const formatted = this.formatValue(value, col, config);
				const escaped = this.escapeXML(formatted);
				xml += `    <${key}>${escaped}</${key}>\n`;
			}
			xml += '  </row>\n';
		}
		
		xml += '</data>';
		
		const filename = `${config.filename}.xml`;
		
		return {
			content: xml,
			filename,
			mimeType: 'application/xml',
			size: new Blob([xml]).size,
			metadata: {
				rowCount: data.length,
				columnCount: columns.length,
				exportDate: new Date(),
				format: 'xml'
			}
		};
	}
	
	/**
	 * Export as YAML
	 */
	private async exportYAML(
		data: T[],
		columns: ColumnDefinition[],
		config: ExportConfig
	): Promise<ExportResult> {
		let yaml = '---\n';
		
		for (let i = 0; i < data.length; i++) {
			const row = data[i];
			yaml += `- `;
			
			for (let j = 0; j < columns.length; j++) {
				const col = columns[j];
				const key = String(col.id);
				const value = row[key];
				const formatted = this.convertValueForYAML(value, col);
				
				if (j === 0) {
					yaml += `${key}: ${formatted}\n`;
				} else {
					yaml += `  ${key}: ${formatted}\n`;
				}
			}
		}
		
		const filename = `${config.filename}.yaml`;
		
		return {
			content: yaml,
			filename,
			mimeType: 'application/x-yaml',
			size: new Blob([yaml]).size,
			metadata: {
				rowCount: data.length,
				columnCount: columns.length,
				exportDate: new Date(),
				format: 'yaml'
			}
		};
	}
	
	/**
	 * Generate default export config
	 */
	static getDefaultConfig(format: ExportFormat): ExportConfig {
		const base: ExportConfig = {
			format,
			filename: `export_${new Date().toISOString().split('T')[0]}`,
			includeHeaders: true,
			dateFormat: 'YYYY-MM-DD',
			numberFormat: {
				locale: 'en-US',
				minimumFractionDigits: 0,
				maximumFractionDigits: 2
			},
			encoding: 'utf-8'
		};
		
		switch (format) {
			case 'csv':
				return {
					...base,
					delimiter: ',',
					qualifier: '"',
					lineSeparator: '\n',
					escapeQuotes: true
				} as CSVConfig;
				
			case 'excel':
				return {
					...base,
					sheetName: 'Sheet1',
					includeFormatting: true,
					autoSizeColumns: true,
					freezeHeader: true
				} as ExcelConfig;
				
			case 'json':
				return {
					...base,
					prettyPrint: true,
					indent: 2
				} as JSONConfig;
				
			case 'pdf':
				return {
					...base,
					orientation: 'landscape',
					pageSize: 'A4',
					fontSize: 10,
					includePageNumbers: true
				} as PDFConfig;
				
			default:
				return base;
		}
	}
	
	/**
	 * Download exported data as file
	 */
	static downloadFile(result: ExportResult): void {
		const blob = new Blob([result.content], { type: result.mimeType });
		const url = URL.createObjectURL(blob);
		
		const link = document.createElement('a');
		link.href = url;
		link.download = result.filename;
		link.style.display = 'none';
		
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		
		URL.revokeObjectURL(url);
	}
	
	/**
	 * Private helper methods
	 */
	
	private validateInputs(data: T[], columns: ColumnDefinition[], config: ExportConfig): void {
		if (!Array.isArray(data)) {
			throw new Error('Data must be an array');
		}
		
		if (!Array.isArray(columns)) {
			throw new Error('Columns must be an array');
		}
		
		if (!config.format) {
			throw new Error('Export format is required');
		}
		
		if (!config.filename) {
			throw new Error('Filename is required');
		}
	}
	
	private filterColumns(columns: ColumnDefinition[], includeColumns?: string[]): ColumnDefinition[] {
		if (!includeColumns || includeColumns.length === 0) {
			return columns.filter(col => col.visible !== false);
		}
		
		return columns.filter(col => 
			includeColumns.includes(String(col.id)) && col.visible !== false
		);
	}
	
	private formatData(data: T[], columns: ColumnDefinition[], config: ExportConfig): T[] {
		// Apply any global data transformations here
		return data;
	}
	
	private formatValue(value: any, column: ColumnDefinition, config: ExportConfig): string {
		if (value == null) return '';
		
		// Use custom formatter if provided
		const customFormatter = config.formatters?.[String(column.id)];
		if (customFormatter) {
			return customFormatter(value, {} as DataRow);
		}
		
		// Use column formatter if provided
		if (column.formatter) {
			return column.formatter(value, {} as DataRow);
		}
		
		// Format based on column type
		switch (column.type) {
			case 'date':
				if (value instanceof Date) {
					return this.formatDate(value, config.dateFormat);
				}
				return String(value);
				
			case 'number':
			case 'currency':
				if (typeof value === 'number') {
					return this.formatNumber(value, config.numberFormat);
				}
				return String(value);
				
			case 'boolean':
				return value ? 'Yes' : 'No';
				
			case 'array':
				if (Array.isArray(value)) {
					return value.join(', ');
				}
				return String(value);
				
			default:
				return String(value);
		}
	}
	
	private formatDate(date: Date, format: string): string {
		// Simple date formatting - could be enhanced with a library like date-fns
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		
		return format
			.replace('YYYY', String(year))
			.replace('MM', month)
			.replace('DD', day);
	}
	
	private formatNumber(value: number, options: ExportConfig['numberFormat']): string {
		return new Intl.NumberFormat(options.locale, {
			minimumFractionDigits: options.minimumFractionDigits,
			maximumFractionDigits: options.maximumFractionDigits
		}).format(value);
	}
	
	private escapeCSVField(value: string, config: CSVConfig): string {
		if (!value) return '';
		
		const needsQuoting = value.includes(config.delimiter) || 
						   value.includes(config.qualifier) || 
						   value.includes('\n') || 
						   value.includes('\r');
		
		if (needsQuoting) {
			const escaped = config.escapeQuotes 
				? value.replace(new RegExp(config.qualifier, 'g'), config.qualifier + config.qualifier)
				: value;
			return config.qualifier + escaped + config.qualifier;
		}
		
		return value;
	}
	
	private escapeXML(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;');
	}
	
	private convertValueForExcel(value: any, column: ColumnDefinition): any {
		if (value == null) return '';
		
		// Excel handles dates, numbers, and strings well natively
		switch (column.type) {
			case 'date':
				return value instanceof Date ? value : new Date(value);
			case 'number':
			case 'currency':
				return typeof value === 'number' ? value : Number(value);
			case 'boolean':
				return Boolean(value);
			default:
				return String(value);
		}
	}
	
	private convertValueForJSON(value: any, column: ColumnDefinition): any {
		if (value == null) return null;
		
		switch (column.type) {
			case 'date':
				return value instanceof Date ? value.toISOString() : value;
			case 'number':
			case 'currency':
				return typeof value === 'number' ? value : Number(value);
			case 'boolean':
				return Boolean(value);
			default:
				return value;
		}
	}
	
	private convertValueForYAML(value: any, column: ColumnDefinition): string {
		if (value == null) return 'null';
		
		switch (column.type) {
			case 'string':
			case 'text':
				// Quote strings that might be ambiguous
				const str = String(value);
				if (str.includes(':') || str.includes('-') || str.match(/^\d/)) {
					return `"${str.replace(/"/g, '\\"')}"`;
				}
				return str;
			case 'boolean':
				return Boolean(value) ? 'true' : 'false';
			case 'number':
				return String(value);
			default:
				return String(value);
		}
	}
}