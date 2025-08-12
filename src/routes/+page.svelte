<!--
  Demo page for svelte-reactive-table
  Showcases the table's features with sample data
-->

<script lang="ts">
	import ReactiveTable from '$lib/components/table/ReactiveTable.svelte';
	import { FirebaseAdapter } from '$lib/adapters/firebase/FirebaseAdapter.svelte.js';
	import type { TableConfig, DataRow } from '$lib/types/core/index.js';

	// Sample data for the demo
	const sampleData: DataRow[] = [
		{
			id: '1',
			name: 'John Doe',
			email: 'john@example.com',
			age: 32,
			department: 'Engineering',
			salary: 75000,
			active: true,
			joinDate: '2022-01-15'
		},
		{
			id: '2',
			name: 'Jane Smith',
			email: 'jane@example.com',
			age: 28,
			department: 'Marketing',
			salary: 65000,
			active: true,
			joinDate: '2022-03-20'
		},
		{
			id: '3',
			name: 'Bob Johnson',
			email: 'bob@example.com',
			age: 35,
			department: 'Sales',
			salary: 80000,
			active: false,
			joinDate: '2021-11-10'
		},
		{
			id: '4',
			name: 'Alice Brown',
			email: 'alice@example.com',
			age: 29,
			department: 'Engineering',
			salary: 78000,
			active: true,
			joinDate: '2022-02-08'
		},
		{
			id: '5',
			name: 'Charlie Wilson',
			email: 'charlie@example.com',
			age: 31,
			department: 'HR',
			salary: 60000,
			active: true,
			joinDate: '2022-04-12'
		},
		{
			id: '6',
			name: 'Diana Davis',
			email: 'diana@example.com',
			age: 27,
			department: 'Marketing',
			salary: 62000,
			active: true,
			joinDate: '2022-05-18'
		},
		{
			id: '7',
			name: 'Eve Miller',
			email: 'eve@example.com',
			age: 33,
			department: 'Engineering',
			salary: 82000,
			active: false,
			joinDate: '2021-09-25'
		},
		{
			id: '8',
			name: 'Frank Garcia',
			email: 'frank@example.com',
			age: 30,
			department: 'Sales',
			salary: 72000,
			active: true,
			joinDate: '2022-06-30'
		},
		{
			id: '9',
			name: 'Grace Lee',
			email: 'grace@example.com',
			age: 26,
			department: 'HR',
			salary: 58000,
			active: true,
			joinDate: '2022-07-14'
		},
		{
			id: '10',
			name: 'Henry Taylor',
			email: 'henry@example.com',
			age: 34,
			department: 'Engineering',
			salary: 85000,
			active: true,
			joinDate: '2021-12-03'
		}
	];

	// Table configuration
	const tableConfig: TableConfig<DataRow> = {
		id: 'employee-table',
		schema: {
			columns: [
				{
					id: 'name',
					header: 'Name',
					type: 'text',
					width: 150,
					sortable: true,
					filterable: true,
					required: true
				},
				{
					id: 'email',
					header: 'Email',
					type: 'email',
					width: 200,
					sortable: true,
					filterable: true,
					onClick: (value, row) => {
						window.open(`mailto:${value}`, '_blank');
					}
				},
				{
					id: 'age',
					header: 'Age',
					type: 'number',
					width: 80,
					sortable: true,
					filterable: true,
					align: 'right',
					precision: 0
				},
				{
					id: 'department',
					header: 'Department',
					type: 'text',
					width: 120,
					sortable: true,
					filterable: true
				},
				{
					id: 'salary',
					header: 'Salary',
					type: 'currency',
					width: 120,
					sortable: true,
					filterable: true,
					align: 'right'
				},
				{
					id: 'active',
					header: 'Active',
					type: 'boolean',
					width: 80,
					sortable: true,
					filterable: true,
					align: 'center'
				},
				{
					id: 'joinDate',
					header: 'Join Date',
					type: 'date',
					width: 120,
					sortable: true,
					filterable: true
				}
			]
		},
		adapter: {
			type: 'firebase',
			options: {
				cache: {
					enabled: true,
					ttl: 300000 // 5 minutes
				}
			}
		},
		options: {
			pageSize: 5,
			sortable: true,
			filterable: true,
			resizable: true,
			selectable: true,
			multiSelect: true,
			virtual: false,
			realtime: false,
			optimistic: true,
			emptyMessage: 'No employees found',
			onRowClick: (row, event) => {
				console.log('Row clicked:', row);
			},
			onRowDoubleClick: (row, event) => {
				console.log('Row double-clicked:', row);
			},
			accessibility: {
				ariaLabel: 'Employee data table',
				ariaDescription:
					'A table showing employee information with sorting, filtering, and selection capabilities',
				keyboardNavigation: true,
				screenReader: true
			}
		}
	};

	// Demo state
	let selectedRows = $state<Set<string>>(new Set());
	let currentFilter = $state('');
	let currentSort = $state<{ column: string; direction: 'asc' | 'desc' } | null>(null);
	let tableInstance: any;

	// Demo functions
	function handleRowSelection(rows: string[]) {
		selectedRows = new Set(rows);
		console.log('Selected rows:', rows);
	}

	function handleFilterChange(value: string) {
		currentFilter = value;
		if (tableInstance) {
			tableInstance.setFilter({
				column: 'name',
				operator: 'contains',
				value: value
			});
		}
	}

	function handleSortChange(column: string, direction: 'asc' | 'desc') {
		currentSort = { column, direction };
		if (tableInstance) {
			tableInstance.setSort({
				column,
				direction
			});
		}
	}

	function clearFilters() {
		currentFilter = '';
		if (tableInstance) {
			tableInstance.clearFilters();
		}
	}

	function clearSort() {
		currentSort = null;
		if (tableInstance) {
			tableInstance.clearSort();
		}
	}

	function exportData() {
		if (tableInstance) {
			const csvData = tableInstance.export('csv');
			const blob = new Blob([csvData], { type: 'text/csv' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'employee-data.csv';
			a.click();
			URL.revokeObjectURL(url);
		}
	}

	function refreshData() {
		if (tableInstance) {
			tableInstance.refresh();
		}
	}
</script>

<svelte:head>
	<title>svelte-reactive-table Demo</title>
	<meta
		name="description"
		content="Demo of the svelte-reactive-table library showcasing sorting, filtering, and real-time data capabilities"
	/>
</svelte:head>

<div class="demo-container">
	<header class="demo-header">
		<h1>🚀 svelte-reactive-table Demo</h1>
		<p>A powerful, reactive data table for Svelte 5 with real-time capabilities</p>
	</header>

	<div class="demo-content">
		<!-- Demo Controls -->
		<div class="demo-controls">
			<div class="control-group">
				<label for="filter-input">Filter by Name:</label>
				<input
					id="filter-input"
					type="text"
					placeholder="Type to filter..."
					bind:value={currentFilter}
					oninput={(e) => handleFilterChange((e.target as HTMLInputElement).value)}
				/>
			</div>

			<div class="control-group">
				<label>Sort by:</label>
				<select
					onchange={(e) => {
						const target = e.target as HTMLSelectElement;
						const [column, direction] = target.value.split('-');
						handleSortChange(column, direction as 'asc' | 'desc');
					}}
				>
					<option value="">No sorting</option>
					<option value="name-asc">Name (A-Z)</option>
					<option value="name-desc">Name (Z-A)</option>
					<option value="age-asc">Age (Low-High)</option>
					<option value="age-desc">Age (High-Low)</option>
					<option value="salary-asc">Salary (Low-High)</option>
					<option value="salary-desc">Salary (High-Low)</option>
					<option value="joinDate-asc">Join Date (Old-New)</option>
					<option value="joinDate-desc">Join Date (New-Old)</option>
				</select>
			</div>

			<div class="control-group">
				<button class="btn btn-secondary" onclick={clearFilters}>Clear Filters</button>
				<button class="btn btn-secondary" onclick={clearSort}>Clear Sort</button>
			</div>

			<div class="control-group">
				<button class="btn btn-primary" onclick={exportData}>Export CSV</button>
				<button class="btn btn-primary" onclick={refreshData}>Refresh</button>
			</div>
		</div>

		<!-- Demo Stats -->
		<div class="demo-stats">
			<div class="stat">
				<span class="stat-label">Total Rows:</span>
				<span class="stat-value">{sampleData.length}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Selected:</span>
				<span class="stat-value">{selectedRows.size}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Filtered:</span>
				<span class="stat-value">{currentFilter ? 'Yes' : 'No'}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Sorted:</span>
				<span class="stat-value"
					>{currentSort ? `${currentSort.column} (${currentSort.direction})` : 'No'}</span
				>
			</div>
		</div>

		<!-- Reactive Table -->
		<div class="table-wrapper">
			<ReactiveTable config={tableConfig} bind:this={tableInstance} class="demo-table" />
		</div>

		<!-- Feature Showcase -->
		<div class="features">
			<h2>✨ Features Showcased</h2>
			<div class="feature-grid">
				<div class="feature-card">
					<h3>🔄 Reactive State</h3>
					<p>Built with Svelte 5 runes for optimal performance and reactivity</p>
				</div>
				<div class="feature-card">
					<h3>📊 Sorting & Filtering</h3>
					<p>Multi-column sorting and advanced filtering capabilities</p>
				</div>
				<div class="feature-card">
					<h3>📱 Responsive Design</h3>
					<p>Mobile-friendly with adaptive layouts and touch support</p>
				</div>
				<div class="feature-card">
					<h3>♿ Accessibility</h3>
					<p>Full ARIA support, keyboard navigation, and screen reader compatibility</p>
				</div>
				<div class="feature-card">
					<h3>🎨 Customizable</h3>
					<p>Extensive theming options and custom cell renderers</p>
				</div>
				<div class="feature-card">
					<h3>⚡ Virtual Scrolling</h3>
					<p>Handle large datasets efficiently with virtual scrolling</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.demo-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.demo-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.demo-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.demo-header p {
		font-size: 1.125rem;
		color: #6b7280;
		margin: 0;
	}

	.demo-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.demo-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: end;
		padding: 1.5rem;
		background: #f8fafc;
		border-radius: 0.75rem;
		border: 1px solid #e2e8f0;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.control-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.control-group input,
	.control-group select {
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: white;
	}

	.control-group input:focus,
	.control-group select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.btn-secondary {
		background: #6b7280;
		color: white;
	}

	.btn-secondary:hover {
		background: #4b5563;
		transform: translateY(-1px);
	}

	.demo-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		padding: 1rem;
		background: #f0f9ff;
		border-radius: 0.5rem;
		border: 1px solid #bae6fd;
	}

	.stat {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
	}

	.stat-label {
		font-weight: 500;
		color: #0369a1;
	}

	.stat-value {
		font-weight: 600;
		color: #0c4a6e;
	}

	.table-wrapper {
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		overflow: hidden;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.demo-table {
		--table-bg: #ffffff;
		--table-border: #e2e8f0;
		--table-text: #1f2937;
		--table-header-bg: #f8fafc;
		--table-row-hover: #f1f5f9;
		--table-selected: #dbeafe;
		--table-focus: #3b82f6;
	}

	.features {
		margin-top: 3rem;
	}

	.features h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.feature-card {
		padding: 1.5rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.feature-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.feature-card h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.feature-card p {
		color: #6b7280;
		margin: 0;
		line-height: 1.5;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.demo-container {
			background: #111827;
			color: #f9fafb;
		}

		.demo-header h1 {
			color: #f9fafb;
		}

		.demo-header p {
			color: #9ca3af;
		}

		.demo-controls {
			background: #1f2937;
			border-color: #374151;
		}

		.control-group label {
			color: #d1d5db;
		}

		.control-group input,
		.control-group select {
			background: #374151;
			border-color: #4b5563;
			color: #f9fafb;
		}

		.demo-stats {
			background: #1e3a8a;
			border-color: #3b82f6;
		}

		.stat-label {
			color: #93c5fd;
		}

		.stat-value {
			color: #dbeafe;
		}

		.table-wrapper {
			border-color: #374151;
		}

		.demo-table {
			--table-bg: #1f2937;
			--table-border: #374151;
			--table-text: #f9fafb;
			--table-header-bg: #111827;
			--table-row-hover: #374151;
			--table-selected: #1e3a8a;
		}

		.features h2 {
			color: #f9fafb;
		}

		.feature-card {
			background: #1f2937;
			border-color: #374151;
		}

		.feature-card h3 {
			color: #f9fafb;
		}

		.feature-card p {
			color: #9ca3af;
		}
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.demo-container {
			padding: 1rem;
		}

		.demo-header h1 {
			font-size: 2rem;
		}

		.demo-controls {
			flex-direction: column;
			align-items: stretch;
		}

		.control-group {
			flex-direction: row;
			align-items: center;
			gap: 1rem;
		}

		.control-group label {
			min-width: 100px;
		}

		.demo-stats {
			grid-template-columns: 1fr;
		}

		.feature-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
