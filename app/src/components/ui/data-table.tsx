"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
	Search, 
	Filter,
	Grid3X3,
	List,
	ChevronDown,
	ChevronUp,
	Edit,
	Trash2,
	Eye
} from "lucide-react";

interface Column {
	key: string;
	label: string;
	sortable?: boolean;
	render?: (value: any, row: any) => React.ReactNode;
	width?: string;
}

interface DataTableProps {
	data: any[];
	columns: Column[];
	searchPlaceholder?: string;
	onSearch?: (term: string) => void;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	onView?: (id: string) => void;
	title?: string;
	description?: string;
	actions?: React.ReactNode;
	cardView?: boolean;
	onToggleView?: (view: 'table' | 'card') => void;
	customActions?: (row: any) => React.ReactNode;
}

export function DataTable({
	data,
	columns,
	searchPlaceholder = "Search...",
	onSearch,
	onEdit,
	onDelete,
	onView,
	title,
	description,
	actions,
	cardView = false,
	onToggleView,
	customActions
}: DataTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [sortColumn, setSortColumn] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
	const [viewMode, setViewMode] = useState<'table' | 'card'>(cardView ? 'card' : 'table');

	const handleSearch = (term: string) => {
		setSearchTerm(term);
		onSearch?.(term);
	};

	const handleSort = (columnKey: string) => {
		if (sortColumn === columnKey) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortColumn(columnKey);
			setSortDirection('asc');
		}
	};

	const toggleViewMode = () => {
		const newMode = viewMode === 'table' ? 'card' : 'table';
		setViewMode(newMode);
		onToggleView?.(newMode);
	};

	const SortIcon = ({ columnKey }: { columnKey: string }) => {
		if (sortColumn !== columnKey) {
			return <ChevronDown className="h-4 w-4 opacity-50" />;
		}
		return sortDirection === 'asc' ? 
			<ChevronUp className="h-4 w-4" /> : 
			<ChevronDown className="h-4 w-4" />;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					{title && <h2 className="text-2xl font-bold gradient-text">{title}</h2>}
					{description && <p className="text-muted-foreground">{description}</p>}
				</div>
				<div className="flex items-center space-x-2">
					{actions}
					<Button
						variant="outline"
						size="sm"
						onClick={toggleViewMode}
						title={`Switch to ${viewMode === 'table' ? 'card' : 'table'} view`}
					>
						{viewMode === 'table' ? <Grid3X3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
					</Button>
				</div>
			</div>

			{/* Search */}
			<Card>
				<CardContent className="pt-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder={searchPlaceholder}
							value={searchTerm}
							onChange={(e) => handleSearch(e.target.value)}
							className="pl-10"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Data Display */}
			{viewMode === 'table' ? (
				<Card>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-gray-200">
										{columns.map((column) => (
											<th
												key={column.key}
												className={`text-left py-3 px-4 font-medium text-gray-700 ${
													column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''
												}`}
												style={{ width: column.width }}
												onClick={() => column.sortable && handleSort(column.key)}
											>
												<div className="flex items-center space-x-1">
													<span>{column.label}</span>
													{column.sortable && <SortIcon columnKey={column.key} />}
												</div>
											</th>
										))}
										{(onEdit || onDelete || onView || customActions) && (
											<th className="text-right py-3 px-4 font-medium text-gray-700">
												Actions
											</th>
										)}
									</tr>
								</thead>
								<tbody>
									{data.map((row, index) => {
										const isActive = row.enabled || false;
										return (
											<tr 
												key={row._id || index} 
												className={`border-b border-gray-100 hover:bg-gray-50 ${
													isActive ? 'bg-green-50 border-green-200' : ''
												}`}
											>
											{columns.map((column) => (
												<td key={column.key} className="py-4 px-4">
													{column.render ? 
														column.render(row[column.key], row) : 
														row[column.key]
													}
												</td>
											))}
											{(onEdit || onDelete || onView || customActions) && (
												<td className="py-4 px-4">
													<div className="flex items-center justify-end space-x-2">
														{customActions ? (
															customActions(row)
														) : (
															<>
																{onView && (
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => onView(row._id)}
																		title="View"
																	>
																		<Eye className="h-4 w-4" />
																	</Button>
																)}
																{onEdit && (
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => onEdit(row._id)}
																		title="Edit"
																	>
																		<Edit className="h-4 w-4" />
																	</Button>
																)}
																{onDelete && (
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() => onDelete(row._id)}
																		title="Delete"
																		className="text-red-600 hover:text-red-700"
																	>
																		<Trash2 className="h-4 w-4" />
																	</Button>
																)}
															</>
														)}
													</div>
												</td>
											)}
										</tr>
									);
								})}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{data.map((row, index) => {
						const isActive = row.enabled || false;
						return (
							<Card 
								key={row._id || index} 
								className={`hover:shadow-lg transition-shadow ${
									isActive ? 'bg-green-50 border-green-200' : ''
								}`}
							>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										{columns.slice(0, 2).map((column) => (
											<div key={column.key} className="mb-2">
												{column.render ? 
													column.render(row[column.key], row) : 
													<div className="text-sm text-gray-600">{row[column.key]}</div>
												}
											</div>
										))}
									</div>
									{(onEdit || onDelete || onView) && (
										<div className="flex items-center space-x-1">
											{onView && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onView(row._id)}
													title="View"
												>
													<Eye className="h-4 w-4" />
												</Button>
											)}
											{onEdit && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onEdit(row._id)}
													title="Edit"
												>
													<Edit className="h-4 w-4" />
												</Button>
											)}
											{onDelete && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => onDelete(row._id)}
													title="Delete"
													className="text-red-600 hover:text-red-700"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</div>
									)}
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{columns.slice(2).map((column) => (
										<div key={column.key}>
											{column.render ? 
												column.render(row[column.key], row) : 
												<div className="text-sm text-gray-600">{row[column.key]}</div>
											}
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					);
				})}
				</div>
			)}

			{/* Empty State */}
			{data.length === 0 && (
				<Card className="text-center py-12">
					<CardContent>
						<div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
							<Search className="w-8 h-8 text-gray-400" />
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
						<p className="text-gray-500 mb-4">
							{searchTerm 
								? "Try adjusting your search criteria"
								: "Get started by adding your first item"
							}
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
} 