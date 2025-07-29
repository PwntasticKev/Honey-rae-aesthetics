"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
	Menu, 
	Search, 
	Bell, 
	LogOut,
	Filter,
	X,
	ArrowLeft
} from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";
import { searchService, type SearchResult } from "@/lib/searchService";
import { useRouter } from "next/navigation";

export default function SearchPage() {
	const { user, logout } = useAuth();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [results, setResults] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState({
		types: [] as string[],
		status: [] as string[]
	});
	const searchParams = useSearchParams();
	const router = useRouter();
	const query = searchParams.get('q') || '';

	useEffect(() => {
		if (query) {
			setLoading(true);
			const searchResults = searchService.search(query, filters);
			setResults(searchResults);
			setLoading(false);
		}
	}, [query, filters]);

	const handleResultClick = (result: SearchResult) => {
		router.push(result.url);
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case 'client':
				return 'bg-blue-100 text-blue-800';
			case 'appointment':
				return 'bg-green-100 text-green-800';
			case 'workflow':
				return 'bg-purple-100 text-purple-800';
			case 'message':
				return 'bg-orange-100 text-orange-800';
			case 'file':
				return 'bg-pink-100 text-pink-800';
			case 'template':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getTypeLabel = (type: string) => {
		switch (type) {
			case 'client':
				return 'Client';
			case 'appointment':
				return 'Appointment';
			case 'workflow':
				return 'Workflow';
			case 'message':
				return 'Message';
			case 'file':
				return 'File';
			case 'template':
				return 'Template';
			default:
				return type;
		}
	};

	const toggleTypeFilter = (type: string) => {
		setFilters(prev => ({
			...prev,
			types: prev.types.includes(type) 
				? prev.types.filter(t => t !== type)
				: [...prev.types, type]
		}));
	};

	const toggleStatusFilter = (status: string) => {
		setFilters(prev => ({
			...prev,
			status: prev.status.includes(status) 
				? prev.status.filter(s => s !== status)
				: [...prev.status, status]
		}));
	};

	const clearFilters = () => {
		setFilters({ types: [], status: [] });
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
			{/* Sidebar */}
			<Sidebar
				isOpen={sidebarOpen}
				onToggle={() => setSidebarOpen(!sidebarOpen)}
			/>

			{/* Main Content */}
			<div className="flex-1 flex flex-col lg:ml-64 relative">
				{/* Header */}
				<header className="bg-white border-b border-gray-200 shadow-sm">
					<div className="flex items-center justify-between px-6 h-16">
						<div className="flex items-center space-x-6">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setSidebarOpen(true)}
								className="lg:hidden z-10"
								data-testid="mobile-menu-button"
							>
								<Menu className="h-5 w-5" />
							</Button>
							
							{/* Page Title and Greeting */}
							<div>
								<h1 className="text-xl font-bold text-gray-900">Search Results</h1>
								<p className="text-sm text-gray-600">
									{query ? `Results for "${query}"` : 'Search across your data'}
								</p>
							</div>
						</div>
						
						<div className="flex items-center space-x-4">
							{/* Search */}
							<div className="hidden md:block">
								<GlobalSearch />
							</div>
							
							{/* Notifications */}
							<NotificationDropdown />
							
							{/* User Menu */}
							<div className="flex items-center space-x-3">
								<Avatar className="w-8 h-8">
									<AvatarImage src="/avatar.jpg" />
									<AvatarFallback className="bg-orange-500 text-white">
										{user?.email?.charAt(0).toUpperCase() || "A"}
									</AvatarFallback>
								</Avatar>
								<div className="hidden md:block">
									<p className="text-sm font-medium text-gray-900">Dr. Rae</p>
									<p className="text-xs text-gray-500">Admin</p>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={logout}
									title="Logout"
									className="text-gray-600 hover:text-gray-900"
								>
									<LogOut className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				</header>

				{/* Page Content */}
				<main className="flex-1 p-6">
					<div className="max-w-7xl mx-auto">
						{/* Search Header */}
						<div className="mb-6">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-4">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => router.back()}
										className="flex items-center space-x-2"
									>
										<ArrowLeft className="h-4 w-4" />
										<span>Back</span>
									</Button>
									<div className="flex items-center space-x-2">
										<Search className="h-5 w-5 text-gray-400" />
										<span className="text-lg font-medium">
											{query ? `"${query}"` : 'Search'}
										</span>
									</div>
								</div>
								{results.length > 0 && (
									<span className="text-sm text-gray-500">
										{results.length} result{results.length !== 1 ? 's' : ''}
									</span>
								)}
							</div>
						</div>

						{/* Filters */}
						<div className="mb-6">
							<div className="flex items-center space-x-4">
								<span className="text-sm font-medium text-gray-700">Filter by:</span>
								
								{/* Type Filters */}
								<div className="flex items-center space-x-2">
									<span className="text-xs text-gray-500">Type:</span>
									{['client', 'appointment', 'workflow', 'message', 'file', 'template'].map(type => (
										<Button
											key={type}
											variant={filters.types.includes(type) ? "default" : "outline"}
											size="sm"
											onClick={() => toggleTypeFilter(type)}
											className="text-xs"
										>
											{getTypeLabel(type)}
										</Button>
									))}
								</div>

								{/* Status Filters */}
								<div className="flex items-center space-x-2">
									<span className="text-xs text-gray-500">Status:</span>
									{['active', 'scheduled', 'completed', 'draft'].map(status => (
										<Button
											key={status}
											variant={filters.status.includes(status) ? "default" : "outline"}
											size="sm"
											onClick={() => toggleStatusFilter(status)}
											className="text-xs"
										>
											{status}
										</Button>
									))}
								</div>

								{(filters.types.length > 0 || filters.status.length > 0) && (
									<Button
										variant="ghost"
										size="sm"
										onClick={clearFilters}
										className="text-xs text-gray-500"
									>
										<X className="h-3 w-3 mr-1" />
										Clear filters
									</Button>
								)}
							</div>
						</div>

						{/* Results */}
						<div className="space-y-4">
							{loading ? (
								<div className="text-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
									<p className="text-gray-500 mt-2">Searching...</p>
								</div>
							) : results.length === 0 ? (
								<div className="text-center py-8">
									<Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
									<p className="text-gray-500">
										{query 
											? `No results found for "${query}". Try a different search term.`
											: 'Enter a search term to find what you\'re looking for.'
										}
									</p>
								</div>
							) : (
								results.map((result) => (
									<Card 
										key={result.id} 
										className="cursor-pointer hover:shadow-md transition-shadow"
										onClick={() => handleResultClick(result)}
									>
										<CardContent className="p-4">
											<div className="flex items-start space-x-4">
												<div className="flex-shrink-0 mt-1">
													<span className="text-2xl">{result.icon}</span>
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center justify-between mb-2">
														<h3 className="text-lg font-medium text-gray-900 truncate">
															{result.title}
														</h3>
														<Badge className={`${getTypeColor(result.type)}`}>
															{getTypeLabel(result.type)}
														</Badge>
													</div>
													<p className="text-gray-600 mb-3">
														{result.description}
													</p>
													{result.metadata && (
														<div className="flex items-center space-x-4 text-sm text-gray-500">
															{result.metadata.email && (
																<span>{result.metadata.email}</span>
															)}
															{result.metadata.date && (
																<span>{result.metadata.date}</span>
															)}
															{result.metadata.status && (
																<span className="capitalize">{result.metadata.status}</span>
															)}
															{result.metadata.phone && (
																<span>{result.metadata.phone}</span>
															)}
														</div>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								))
							)}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
} 