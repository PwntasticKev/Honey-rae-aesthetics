"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
	Search, 
	Filter,
	Upload,
	Edit,
	Trash2,
	Eye,
	Download,
	Tag,
	Calendar,
	Image,
	Grid3X3,
	List,
	Plus
} from "lucide-react";

interface Photo {
	_id: string;
	fileName: string;
	clientName: string;
	uploadDate: number;
	tags: string[];
	fileSize: string;
	dimensions: string;
	url: string;
}

interface PhotoGalleryProps {
	photos: Photo[];
	onUploadPhoto: () => void;
	onEditPhoto: (photoId: string) => void;
	onDeletePhoto: (photoId: string) => void;
}

export function PhotoGallery({ photos, onUploadPhoto, onEditPhoto, onDeletePhoto }: PhotoGalleryProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [tagFilter, setTagFilter] = useState("all");
	const [viewMode, setViewMode] = useState<"table" | "grid">("table");

	const filteredPhotos = photos.filter(photo => {
		const matchesSearch = photo.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			photo.clientName.toLowerCase().includes(searchTerm.toLowerCase());
		
		const matchesTag = tagFilter === "all" || photo.tags.includes(tagFilter);
		
		return matchesSearch && matchesTag;
	});

	const getAllTags = () => {
		const tags = new Set<string>();
		photos.forEach(photo => {
			photo.tags.forEach(tag => tags.add(tag));
		});
		return Array.from(tags);
	};

	const formatFileSize = (size: string) => {
		return size;
	};

	const formatDimensions = (dimensions: string) => {
		return dimensions;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold gradient-text">Photo Gallery</h2>
					<p className="text-muted-foreground">
						Manage client photos and treatment progress ({filteredPhotos.length} photos)
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
					>
						{viewMode === "table" ? <Grid3X3 className="w-4 h-4 mr-2" /> : <List className="w-4 h-4 mr-2" />}
						{viewMode === "table" ? "Grid View" : "Table View"}
					</Button>
					<Button onClick={onUploadPhoto} className="bg-gradient-to-r from-pink-500 to-purple-600">
						<Upload className="w-4 h-4 mr-2" />
						Upload Photo
					</Button>
				</div>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								placeholder="Search photos by filename or client..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-muted-foreground" />
							<select
								value={tagFilter}
								onChange={(e) => setTagFilter(e.target.value)}
								className="border border-gray-300 rounded-md px-3 py-2 text-sm"
							>
								<option value="all">All Tags</option>
								{getAllTags().map(tag => (
									<option key={tag} value={tag}>{tag}</option>
								))}
							</select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Photos Display */}
			{viewMode === "table" ? (
				/* Table View */
				<Card>
					<CardHeader>
						<CardTitle>Photo Database</CardTitle>
						<CardDescription>
							All photos in your practice management system
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-gray-200">
										<th className="text-left py-3 px-4 font-medium text-gray-700">Photo</th>
										<th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
										<th className="text-left py-3 px-4 font-medium text-gray-700">Tags</th>
										<th className="text-left py-3 px-4 font-medium text-gray-700">Upload Date</th>
										<th className="text-left py-3 px-4 font-medium text-gray-700">File Info</th>
										<th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
									</tr>
								</thead>
								<tbody>
									{filteredPhotos.map((photo) => (
										<tr key={photo._id} className="border-b border-gray-100 hover:bg-gray-50">
											<td className="py-4 px-4">
												<div className="flex items-center space-x-3">
													<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
														<Image className="w-6 h-6 text-gray-400" />
													</div>
													<div>
														<div className="font-medium text-gray-900">{photo.fileName}</div>
														<div className="text-sm text-gray-500">{formatFileSize(photo.fileSize)}</div>
													</div>
												</div>
											</td>
											<td className="py-4 px-4">
												<div className="font-medium text-gray-900">{photo.clientName}</div>
											</td>
											<td className="py-4 px-4">
												<div className="flex flex-wrap gap-1">
													{photo.tags.slice(0, 2).map((tag, index) => (
														<Badge key={index} variant="secondary" className="text-xs">
															{tag}
														</Badge>
													))}
													{photo.tags.length > 2 && (
														<Badge variant="outline" className="text-xs">
															+{photo.tags.length - 2}
														</Badge>
													)}
												</div>
											</td>
											<td className="py-4 px-4 text-sm text-gray-500">
												{new Date(photo.uploadDate).toLocaleDateString()}
											</td>
											<td className="py-4 px-4 text-sm text-gray-500">
												{formatDimensions(photo.dimensions)}
											</td>
											<td className="py-4 px-4">
												<div className="flex items-center justify-end space-x-2">
													<Button
														variant="ghost"
														size="sm"
														title="View"
													>
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														title="Download"
													>
														<Download className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => onEditPhoto(photo._id)}
														title="Edit"
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => onDeletePhoto(photo._id)}
														title="Delete"
														className="text-red-600 hover:text-red-700"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Empty State */}
						{filteredPhotos.length === 0 && (
							<div className="text-center py-12">
								<Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
								<h3 className="text-lg font-semibold text-gray-900 mb-2">No photos found</h3>
								<p className="text-gray-600 mb-4">
									{searchTerm || tagFilter !== "all" 
										? "Try adjusting your search or filters"
										: "Get started by uploading your first photo"
									}
								</p>
								{!searchTerm && tagFilter === "all" && (
									<Button onClick={onUploadPhoto} className="bg-gradient-to-r from-pink-500 to-purple-600">
										<Upload className="w-4 h-4 mr-2" />
										Upload Your First Photo
									</Button>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			) : (
				/* Grid View */
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredPhotos.map((photo) => (
						<Card key={photo._id} className="hover:shadow-lg transition-shadow">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex items-center space-x-3">
										<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
											<Image className="w-6 h-6 text-gray-400" />
										</div>
										<div>
											<CardTitle className="text-lg">{photo.fileName}</CardTitle>
											<CardDescription>
												{photo.clientName} • {formatFileSize(photo.fileSize)}
											</CardDescription>
										</div>
									</div>
									<div className="flex items-center space-x-1">
										<Button
											variant="ghost"
											size="icon"
											title="View"
										>
											<Eye className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => onEditPhoto(photo._id)}
											title="Edit"
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => onDeletePhoto(photo._id)}
											title="Delete"
											className="text-red-600 hover:text-red-700"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								{/* Tags */}
								{photo.tags.length > 0 && (
									<div className="flex flex-wrap gap-1">
										{photo.tags.slice(0, 3).map((tag) => (
											<Badge key={tag} variant="secondary" className="text-xs">
												{tag}
											</Badge>
										))}
										{photo.tags.length > 3 && (
											<Badge variant="outline" className="text-xs">
												+{photo.tags.length - 3} more
											</Badge>
										)}
									</div>
								)}

								{/* File Info */}
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<div className="flex items-center space-x-2">
										<Calendar className="h-3 w-3" />
										<span>{new Date(photo.uploadDate).toLocaleDateString()}</span>
									</div>
									<div className="flex items-center space-x-2">
										<Download className="h-3 w-3" />
										<span>{formatDimensions(photo.dimensions)}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Empty State for Grid View */}
			{viewMode === "grid" && filteredPhotos.length === 0 && (
				<Card className="text-center py-12">
					<CardContent>
						<Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">No photos found</h3>
						<p className="text-gray-600 mb-4">
							{searchTerm || tagFilter !== "all" 
								? "Try adjusting your search or filters"
								: "Get started by uploading your first photo"
							}
						</p>
						{!searchTerm && tagFilter === "all" && (
							<Button onClick={onUploadPhoto} className="bg-gradient-to-r from-pink-500 to-purple-600">
								<Upload className="w-4 h-4 mr-2" />
								Upload Your First Photo
							</Button>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
} 