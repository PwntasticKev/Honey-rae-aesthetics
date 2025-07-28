"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
	Search, 
	Grid3X3, 
	List, 
	ChevronUp, 
	Eye, 
	Edit3, 
	Trash2,
	Plus,
	Zap,
	Play,
	Pause,
	Clock,
	MessageSquare,
	Mail,
	Calendar
} from "lucide-react";

interface DataTableProps {
	data: any[];
	columns: {
		key: string;
		label: string;
		render?: (item: any) => React.ReactNode;
	}[];
	title: string;
	description: string;
	searchPlaceholder?: string;
	onSearch?: (query: string) => void;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	onView?: (id: string) => void;
	actions?: React.ReactNode;
	"data-testid"?: string;
}

interface Workflow {
	_id: string;
	name: string;
	description: string;
	trigger: string;
	enabled: boolean;
	steps: any[];
	createdAt: number;
	lastRun?: number;
	runCount: number;
}

export function DataTable({
	data,
	columns,
	title,
	description,
	searchPlaceholder = "Search...",
	onSearch,
	onEdit,
	onDelete,
	onView,
	actions,
	"data-testid": dataTestId,
	...props
}: DataTableProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
	const [sortKey, setSortKey] = useState<string>('');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

	// Debug logging
	console.log('DataTable received data:', data);
	console.log('DataTable received columns:', columns);

	const filteredData = useMemo(() => {
		let filtered = data;
		
		if (searchQuery && onSearch) {
			onSearch(searchQuery);
			return data; // Let parent handle filtering
		} else if (searchQuery) {
			filtered = data.filter(item =>
				Object.values(item).some(value =>
					value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
				)
			);
		}

		if (sortKey) {
			filtered = [...filtered].sort((a, b) => {
				const aVal = a[sortKey];
				const bVal = b[sortKey];
				
				if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
				if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
				return 0;
			});
		}

		return filtered;
	}, [data, searchQuery, sortKey, sortDirection, onSearch]);

	const handleSort = (key: string) => {
		if (sortKey === key) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortKey(key);
			setSortDirection('asc');
		}
	};

	const getWorkflowStatus = (enabled: boolean) => {
		return enabled ? 'active' : 'inactive';
	};

	const getWorkflowStatusColor = (enabled: boolean) => {
		return enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
	};

	const getWorkflowIcon = (trigger: string) => {
		switch (trigger) {
			case 'appointment_completed':
				return Calendar;
			case 'client_added':
				return MessageSquare;
			case 'birthday':
				return Clock;
			default:
				return Zap;
		}
	};

	return (
		<div className="space-y-4" data-testid={dataTestId} {...props}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">{title}</h2>
					<p className="text-gray-600">{description}</p>
				</div>
				{actions && (
					<div className="flex items-center space-x-2">
						{actions}
					</div>
				)}
			</div>

			{/* Search and View Toggle */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
						<Input
							placeholder={searchPlaceholder}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10 w-64"
							data-testid="search-input"
						/>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
						data-testid="view-toggle"
					>
						{viewMode === 'table' ? <Grid3X3 className="w-4 h-4 mr-2" /> : <List className="w-4 h-4 mr-2" />}
						{viewMode === 'table' ? 'Card View' : 'Table View'}
					</Button>
				</div>
			</div>

			{/* Content */}
			{viewMode === 'table' ? (
				<div className="bg-white rounded-lg shadow overflow-hidden">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								{columns.map((column) => (
									<th
										key={column.key}
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
										onClick={() => handleSort(column.key)}
									>
										<div className="flex items-center space-x-1">
											<span>{column.label}</span>
											{sortKey === column.key && (
												<ChevronUp className={`w-4 h-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
											)}
										</div>
									</th>
								))}
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{filteredData.map((item, index) => (
								<tr key={item._id || index} className="hover:bg-gray-50">
									{columns.map((column) => (
										<td key={column.key} className="px-6 py-4 whitespace-nowrap">
											{column.render ? column.render(item) : item[column.key]}
										</td>
									))}
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
										<div className="flex items-center space-x-2">
											{onView && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => onView(item._id)}
													data-testid="view-button"
												>
													<Eye className="w-4 h-4" />
												</Button>
											)}
											{onEdit && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => onEdit(item._id)}
													data-testid="edit-button"
												>
													<Edit3 className="w-4 h-4" />
												</Button>
											)}
											{onDelete && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => onDelete(item._id)}
													className="text-red-600 hover:text-red-700"
													data-testid="delete-button"
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredData.map((item, index) => (
						<Card key={item._id || index} className="hover:shadow-lg transition-shadow">
							<CardContent className="p-4">
								<div className="space-y-3">
									{columns.slice(0, 2).map((column) => (
										<div key={column.key}>
											<div className="text-sm font-medium text-gray-500">{column.label}</div>
											<div className="mt-1">
												{column.render ? column.render(item) : item[column.key]}
											</div>
										</div>
									))}
									<div className="flex items-center justify-between pt-2">
										<div className="flex items-center space-x-2">
											{onView && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => onView(item._id)}
													data-testid="view-button"
												>
													<Eye className="w-4 h-4" />
												</Button>
											)}
											{onEdit && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => onEdit(item._id)}
													data-testid="edit-button"
												>
													<Edit3 className="w-4 h-4" />
												</Button>
											)}
											{onDelete && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => onDelete(item._id)}
													className="text-red-600 hover:text-red-700"
													data-testid="delete-button"
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
} 