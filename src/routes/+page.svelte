<!--
  Demo page for svelte-reactive-table with cell editing
  Showcases all table features including inline cell editing
-->

<script lang="ts">
	import ReactiveTable from '$lib/components/table/ReactiveTable.svelte';
	import type { DataRow } from '$lib/types/core/index.js';
	import type { TableConfig } from '$lib/types/core/TableTypes.js';

	// Define EditingOptions locally to avoid import issues
	interface EditingOptions {
		trigger?: 'click' | 'doubleclick' | 'focus';
		editableColumns?: string[];
		autoSave?: boolean;
		saveOnEnter?: boolean;
		cancelOnEscape?: boolean;
		showButtons?: boolean;
		validateOnSave?: boolean;
		onCellEditStart?: (rowId: string, columnId: string, value: any) => void;
		onCellEditSave?: (
			rowId: string,
			columnId: string,
			oldValue: any,
			newValue: any
		) => void | Promise<void>;
		onCellEditCancel?: (rowId: string, columnId: string, value: any) => void;
		onCellEditError?: (rowId: string, columnId: string, error: Error) => void;
	}

	// Sample data for the demo with proper types for editing
	interface PersonRow extends DataRow {
		id: string;
		name: string;
		email: string;
		age: number;
		department: string;
		salary: number;
		active: boolean;
		joinDate: Date;
		notes: string;
		rating: number;
	}

	let sampleData: PersonRow[] = [
		{
			id: '1',
			name: 'John Doe',
			email: 'john@example.com',
			age: 32,
			department: 'Engineering',
			salary: 75000,
			active: true,
			joinDate: new Date('2022-01-15'),
			notes: 'Senior developer',
			rating: 4.8
		},
		{
			id: '2',
			name: 'Jane Smith',
			email: 'jane@example.com',
			age: 28,
			department: 'Marketing',
			salary: 65000,
			active: true,
			joinDate: new Date('2022-03-20'),
			notes: 'Marketing specialist',
			rating: 4.5
		},
		{
			id: '3',
			name: 'Bob Johnson',
			email: 'bob@example.com',
			age: 35,
			department: 'Sales',
			salary: 80000,
			active: false,
			joinDate: new Date('2021-11-10'),
			notes: 'On leave',
			rating: 4.2
		},
		{
			id: '4',
			name: 'Alice Brown',
			email: 'alice@example.com',
			age: 29,
			department: 'Engineering',
			salary: 78000,
			active: true,
			joinDate: new Date('2022-02-08'),
			notes: 'Full-stack developer',
			rating: 4.7
		},
		{
			id: '5',
			name: 'Charlie Wilson',
			email: 'charlie@example.com',
			age: 31,
			department: 'HR',
			salary: 60000,
			active: true,
			joinDate: new Date('2022-04-12'),
			notes: 'HR coordinator',
			rating: 4.3
		},
		{
			id: '6',
			name: 'Diana Davis',
			email: 'diana@example.com',
			age: 27,
			department: 'Marketing',
			salary: 62000,
			active: true,
			joinDate: new Date('2022-05-18'),
			notes: 'Content creator',
			rating: 4.4
		},
		{
			id: '7',
			name: 'Eve Miller',
			email: 'eve@example.com',
			age: 33,
			department: 'Engineering',
			salary: 82000,
			active: false,
			joinDate: new Date('2021-09-25'),
			notes: 'Team lead',
			rating: 4.9
		},
		{
			id: '8',
			name: 'Frank Garcia',
			email: 'frank@example.com',
			age: 30,
			department: 'Sales',
			salary: 72000,
			active: true,
			joinDate: new Date('2022-06-30'),
			notes: 'Account manager',
			rating: 4.6
		},
		{
			id: '9',
			name: 'Grace Lee',
			email: 'grace@example.com',
			age: 26,
			department: 'HR',
			salary: 58000,
			active: true,
			joinDate: new Date('2022-07-14'),
			notes: 'Recruiter',
			rating: 4.1
		},
		{
			id: '10',
			name: 'Henry Taylor',
			email: 'henry@example.com',
			age: 34,
			department: 'Engineering',
			salary: 85000,
			active: true,
			joinDate: new Date('2021-12-03'),
			notes: 'Backend engineer',
			rating: 4.8
		}
	];

	// Editing configuration state
	let editingEnabled = $state(true);
	let editingTrigger = $state<'click' | 'doubleclick' | 'focus'>('doubleclick');
	let autoSave = $state(true);
	let showButtons = $state(false);
	let validateOnSave = $state(true);

	// Activity log for editing
	let activityLog = $state<string[]>([]);

	function addToLog(message: string) {
		const timestamp = new Date().toLocaleTimeString();
		activityLog = [`${timestamp}: ${message}`, ...activityLog.slice(0, 9)];
	}

	// Create editing options
	const editingOptions = $derived(() => ({
		trigger: editingTrigger,
		autoSave,
		saveOnEnter: true,
		cancelOnEscape: true,
		showButtons,
		validateOnSave,
		editableColumns: ['name', 'email', 'age', 'department', 'salary', 'active', 'notes', 'rating'],
		onCellEditStart: (rowId: string, columnId: string, value: any) => {
			addToLog(`Started editing ${columnId} for ${rowId}: "${value}"`);
		},
		onCellEditSave: async (rowId: string, columnId: string, oldValue: any, newValue: any) => {
			addToLog(`Saved ${columnId} for ${rowId}: "${oldValue}" → "${newValue}"`);

			// Update the actual data
			const rowIndex = sampleData.findIndex((row) => row.id === rowId);
			if (rowIndex !== -1) {
				sampleData[rowIndex] = {
					...sampleData[rowIndex],
					[columnId]: newValue
				};
				// Trigger reactivity
				sampleData = [...sampleData];
			}
		},
		onCellEditCancel: (rowId: string, columnId: string, value: any) => {
			addToLog(`Cancelled editing ${columnId} for ${rowId}`);
		},
		onCellEditError: (rowId: string, columnId: string, error: Error) => {
			addToLog(`Error editing ${columnId} for ${rowId}: ${error.message}`);
		}
	}));

	// Table configuration with editing
	const tableConfig = $derived(() => ({
		id: 'employee-table',
		schema: {
			name: 'Employees',
			version: '1.0.0',
			columns: [
				{
					id: 'name',
					key: 'name',
					header: 'Name',
					type: 'text',
					width: 150,
					sortable: true,
					required: true,
					description: 'Employee full name'
				},
				{
					id: 'email',
					key: 'email',
					header: 'Email',
					type: 'email',
					width: 200,
					sortable: true,
					required: true,
					description: 'Employee email address',
					onClick: (value: any, row: any) => {
						window.open(`mailto:${value}`, '_blank');
					}
				},
				{
					id: 'age',
					key: 'age',
					header: 'Age',
					type: 'number',
					width: 80,
					sortable: true,
					align: 'right',
					min: 18,
					max: 80,
					description: 'Employee age'
				},
				{
					id: 'department',
					key: 'department',
					header: 'Department',
					type: 'text',
					width: 120,
					sortable: true,
					description: 'Work department'
				},
				{
					id: 'salary',
					key: 'salary',
					header: 'Salary',
					type: 'currency',
					width: 120,
					sortable: true,
					align: 'right',
					description: 'Annual salary'
				},
				{
					id: 'active',
					key: 'active',
					header: 'Active',
					type: 'boolean',
					width: 80,
					sortable: true,
					align: 'center',
					description: 'Employment status'
				},
				{
					id: 'joinDate',
					key: 'joinDate',
					header: 'Join Date',
					type: 'date',
					width: 120,
					sortable: true,
					description: 'Date of joining'
				},
				{
					id: 'rating',
					key: 'rating',
					header: 'Rating',
					type: 'number',
					width: 90,
					sortable: true,
					align: 'right',
					precision: 1,
					min: 1,
					max: 5,
					description: 'Performance rating (1-5)'
				},
				{
					id: 'notes',
					key: 'notes',
					header: 'Notes',
					type: 'text',
					width: 180,
					maxLength: 200,
					description: 'Additional notes'
				}
			]
		},
		adapter: {
			type: 'memory' as const
		},
		initialData: sampleData,
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
			editing: editingEnabled ? editingOptions : undefined,
			onRowClick: (row: any, _event: any) => {
				console.log('Row clicked:', row);
			},
			onRowDoubleClick: (row: any, _event: any) => {
				console.log('Row double-clicked:', row);
			},
			accessibility: {
				ariaLabel: 'Editable Employee Data Table',
				ariaDescription:
					'Employee table with inline cell editing capabilities. Double-click cells to edit.',
				keyboardNavigation: true,
				screenReader: true
			}
		}
	}));

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

	// Additional demo functions for editing
	function clearActivityLog() {
		activityLog = [];
	}

	function resetSampleData() {
		sampleData = [
			{
				id: '1',
				name: 'John Doe',
				email: 'john@example.com',
				age: 32,
				department: 'Engineering',
				salary: 75000,
				active: true,
				joinDate: new Date('2022-01-15'),
				notes: 'Senior developer',
				rating: 4.8
			},
			{
				id: '2',
				name: 'Jane Smith',
				email: 'jane@example.com',
				age: 28,
				department: 'Marketing',
				salary: 65000,
				active: true,
				joinDate: new Date('2022-03-20'),
				notes: 'Marketing specialist',
				rating: 4.5
			},
			{
				id: '3',
				name: 'Bob Johnson',
				email: 'bob@example.com',
				age: 35,
				department: 'Sales',
				salary: 80000,
				active: false,
				joinDate: new Date('2021-11-10'),
				notes: 'On leave',
				rating: 4.2
			},
			{
				id: '4',
				name: 'Alice Brown',
				email: 'alice@example.com',
				age: 29,
				department: 'Engineering',
				salary: 78000,
				active: true,
				joinDate: new Date('2022-02-08'),
				notes: 'Full-stack developer',
				rating: 4.7
			},
			{
				id: '5',
				name: 'Charlie Wilson',
				email: 'charlie@example.com',
				age: 31,
				department: 'HR',
				salary: 60000,
				active: true,
				joinDate: new Date('2022-04-12'),
				notes: 'HR coordinator',
				rating: 4.3
			}
		];
		addToLog('Data reset to original values');
	}

	function addNewEmployee() {
		const newId = (sampleData.length + 1).toString();
		const newEmployee: PersonRow = {
			id: newId,
			name: 'New Employee',
			email: 'new@example.com',
			age: 25,
			department: 'TBD',
			salary: 60000,
			active: true,
			joinDate: new Date(),
			notes: 'New hire',
			rating: 0
		};
		sampleData = [...sampleData, newEmployee];
		addToLog(`Added new employee with ID ${newId}`);
	}
</script>

<svelte:head>
	<title>Svelte Reactive Table - Cell Editing Demo</title>
	<meta
		name="description"
		content="Interactive demo showcasing cell editing functionality in svelte-reactive-table"
	/>
</svelte:head>

<div class="demo-container">
	<header class="demo-header">
		<h1>🔥 svelte-reactive-table Demo</h1>
		<p>Interactive table with <strong>cell editing capabilities</strong></p>
		<div class="feature-badges">
			<span class="badge primary">✨ Cell Editing</span>
			<span class="badge secondary">🎯 Type-Aware Inputs</span>
			<span class="badge secondary">⌨️ Keyboard Shortcuts</span>
			<span class="badge secondary">✅ Smart Validation</span>
		</div>
	</header>

	<div class="demo-content">
		<!-- Editing Controls Section -->
		<section class="controls-section">
			<h2>🎛️ Cell Editing Controls</h2>
			<div class="controls-grid">
				<div class="control-group">
					<label>
						<input type="checkbox" bind:checked={editingEnabled} />
						Enable Cell Editing
					</label>
				</div>

				<div class="control-group">
					<label for="trigger-select">Edit Trigger:</label>
					<select id="trigger-select" bind:value={editingTrigger} disabled={!editingEnabled}>
						<option value="click">Single Click</option>
						<option value="doubleclick">Double Click</option>
						<option value="focus">Focus (Tab)</option>
					</select>
				</div>

				<div class="control-group">
					<label>
						<input type="checkbox" bind:checked={autoSave} disabled={!editingEnabled} />
						Auto Save on Blur
					</label>
				</div>

				<div class="control-group">
					<label>
						<input type="checkbox" bind:checked={showButtons} disabled={!editingEnabled} />
						Show Save/Cancel Buttons
					</label>
				</div>

				<div class="control-group">
					<label>
						<input type="checkbox" bind:checked={validateOnSave} disabled={!editingEnabled} />
						Validate on Save
					</label>
				</div>
			</div>

			<div class="action-buttons">
				<button type="button" onclick={addNewEmployee} class="btn btn-primary">
					➕ Add Employee
				</button>
				<button type="button" onclick={resetSampleData} class="btn btn-secondary">
					🔄 Reset Data
				</button>
				<button type="button" onclick={exportData} class="btn btn-secondary">
					📁 Export CSV
				</button>
				<button type="button" onclick={clearActivityLog} class="btn btn-secondary">
					🧹 Clear Log
				</button>
			</div>
		</section>

		<!-- Instructions Section -->
		<section class="instructions-section">
			<h2>📖 How to Edit Cells</h2>
			<div class="instruction-grid">
				<div class="instruction-card">
					<div class="instruction-icon">🖱️</div>
					<h3>Start Editing</h3>
					<p>
						{editingTrigger === 'click'
							? 'Single-click'
							: editingTrigger === 'doubleclick'
								? 'Double-click'
								: 'Tab to focus'}
						on any cell to start editing
					</p>
				</div>
				<div class="instruction-card">
					<div class="instruction-icon">⌨️</div>
					<h3>Keyboard Shortcuts</h3>
					<ul>
						<li><kbd>Enter</kbd> - Save changes</li>
						<li><kbd>Escape</kbd> - Cancel editing</li>
						<li><kbd>Tab</kbd> - Save and move to next</li>
					</ul>
				</div>
				<div class="instruction-card">
					<div class="instruction-icon">🎯</div>
					<h3>Column Types</h3>
					<p>
						Text, Email, Number, Currency, Boolean, Date, and Rating columns with type-specific
						inputs
					</p>
				</div>
			</div>
		</section>

		<!-- Traditional Table Controls -->
		<section class="table-controls-section">
			<h2>🔧 Table Controls</h2>
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
					<label for="sort-select">Sort by:</label>
					<select
						id="sort-select"
						onchange={(e) => {
							const target = e.target as HTMLSelectElement;
							const [column, direction] = target.value.split('-');
							if (column && direction) {
								handleSortChange(column, direction as 'asc' | 'desc');
							}
						}}
					>
						<option value="">No sorting</option>
						<option value="name-asc">Name (A-Z)</option>
						<option value="name-desc">Name (Z-A)</option>
						<option value="age-asc">Age (Low-High)</option>
						<option value="age-desc">Age (High-Low)</option>
						<option value="salary-asc">Salary (Low-High)</option>
						<option value="salary-desc">Salary (High-Low)</option>
						<option value="rating-desc">Rating (High-Low)</option>
					</select>
				</div>

				<div class="control-group">
					<button class="btn btn-secondary" onclick={clearFilters}>Clear Filters</button>
					<button class="btn btn-secondary" onclick={clearSort}>Clear Sort</button>
					<button class="btn btn-primary" onclick={refreshData}>Refresh</button>
				</div>
			</div>
		</section>

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
			<ReactiveTable config={tableConfig as any} bind:this={tableInstance} class="demo-table" />
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
