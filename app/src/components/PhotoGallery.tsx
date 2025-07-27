"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { 
	Upload, 
	Image as ImageIcon, 
	Tag, 
	Trash2, 
	Edit,
	Eye,
	Download,
	X
} from "lucide-react";

interface PhotoGalleryProps {
	orgId: any;
	clientId?: string;
	onUpload?: (files: File[]) => void;
	onDelete?: (fileId: string) => void;
	onTag?: (fileId: string, tags: string[]) => void;
}

interface PhotoFile {
	id: string;
	name: string;
	url: string;
	tags: string[];
	uploadedAt: Date;
	clientId?: string;
}

// Mock data for demonstration
const mockPhotos: PhotoFile[] = [
	{
		id: "1",
		name: "before_photo_1.jpg",
		url: "/api/placeholder/400/300",
		tags: ["before", "face"],
		uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
		clientId: "client-1"
	},
	{
		id: "2",
		name: "after_photo_1.jpg",
		url: "/api/placeholder/400/300",
		tags: ["after", "face"],
		uploadedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
		clientId: "client-1"
	},
	{
		id: "3",
		name: "inspiration_photo_1.jpg",
		url: "/api/placeholder/400/300",
		tags: ["inspiration", "eyes"],
		uploadedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
		clientId: "client-1"
	}
];

const availableTags = [
	"before", "after", "inspiration", "face", "eyes", "lips", "cheeks", 
	"forehead", "chin", "nose", "treatment", "progress", "consultation"
];

export function PhotoGallery({ orgId, clientId, onUpload, onDelete, onTag }: PhotoGalleryProps) {
	const [photos, setPhotos] = useState<PhotoFile[]>(mockPhotos);
	const [selectedPhoto, setSelectedPhoto] = useState<PhotoFile | null>(null);
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [showTagModal, setShowTagModal] = useState(false);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [filterTag, setFilterTag] = useState("all");

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const newPhotos: PhotoFile[] = acceptedFiles.map((file, index) => ({
			id: `new-${Date.now()}-${index}`,
			name: file.name,
			url: URL.createObjectURL(file),
			tags: [],
			uploadedAt: new Date(),
			clientId: clientId
		}));
		
		setPhotos(prev => [...prev, ...newPhotos]);
		if (onUpload) {
			onUpload(acceptedFiles);
		}
		setShowUploadModal(false);
	}, [clientId, onUpload]);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
		},
		multiple: true
	});

	const handleDeletePhoto = (photoId: string) => {
		if (confirm("Are you sure you want to delete this photo?")) {
			setPhotos(prev => prev.filter(photo => photo.id !== photoId));
			if (onDelete) {
				onDelete(photoId);
			}
		}
	};

	const handleTagPhoto = (photoId: string) => {
		const photo = photos.find(p => p.id === photoId);
		if (photo) {
			setSelectedTags(photo.tags);
			setSelectedPhoto(photo);
			setShowTagModal(true);
		}
	};

	const handleSaveTags = () => {
		if (selectedPhoto) {
			setPhotos(prev => prev.map(photo => 
				photo.id === selectedPhoto.id 
					? { ...photo, tags: selectedTags }
					: photo
			));
			if (onTag) {
				onTag(selectedPhoto.id, selectedTags);
			}
		}
		setShowTagModal(false);
		setSelectedPhoto(null);
	};

	const toggleTag = (tag: string) => {
		setSelectedTags(prev => 
			prev.includes(tag) 
				? prev.filter(t => t !== tag)
				: [...prev, tag]
		);
	};

	const filteredPhotos = photos.filter(photo => 
		filterTag === "all" || photo.tags.includes(filterTag)
	);

	const allTags = Array.from(new Set(photos.flatMap(photo => photo.tags)));

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
				<div>
					<h2 className="text-xl font-semibold text-gray-900">Photo Gallery</h2>
					<p className="text-sm text-gray-500">
						Manage client photos and treatment progress
					</p>
				</div>
				
				<div className="flex gap-2">
					<select
						value={filterTag}
						onChange={(e) => setFilterTag(e.target.value)}
						className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="all">All Photos</option>
						{allTags.map(tag => (
							<option key={tag} value={tag}>{tag}</option>
						))}
					</select>
					
					<Button 
						onClick={() => setShowUploadModal(true)}
						className="flex items-center space-x-2"
					>
						<Upload className="h-4 w-4" />
						<span>Upload Photos</span>
					</Button>
				</div>
			</div>

			{/* Photo Count */}
			<div className="text-sm text-gray-600">
				{filteredPhotos.length} of {photos.length} photos
			</div>

			{/* Photo Grid */}
			{filteredPhotos.length === 0 ? (
				<div className="text-center py-12">
					<ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						No photos found
					</h3>
					<p className="text-gray-500 mb-4">
						{photos.length === 0 
							? "Upload your first photo to get started."
							: "Try adjusting your filter to see more photos."
						}
					</p>
					{photos.length === 0 && (
						<Button onClick={() => setShowUploadModal(true)}>
							Upload Photos
						</Button>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{filteredPhotos.map((photo) => (
						<div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden">
							{/* Image */}
							<div className="relative h-48 bg-gray-200">
								<div className="absolute inset-0 flex items-center justify-center">
									<ImageIcon className="h-12 w-12 text-gray-400" />
								</div>
								
								{/* Actions */}
								<div className="absolute top-2 right-2 flex space-x-1">
									<button
										onClick={() => handleTagPhoto(photo.id)}
										className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
										title="Add tags"
									>
										<Tag className="h-3 w-3 text-gray-600" />
									</button>
									<button
										onClick={() => handleDeletePhoto(photo.id)}
										className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
										title="Delete photo"
									>
										<Trash2 className="h-3 w-3 text-red-600" />
									</button>
								</div>
							</div>

							{/* Info */}
							<div className="p-4">
								<h4 className="text-sm font-medium text-gray-900 truncate">
									{photo.name}
								</h4>
								<p className="text-xs text-gray-500 mt-1">
									{photo.uploadedAt.toLocaleDateString()}
								</p>
								
								{/* Tags */}
								{photo.tags.length > 0 && (
									<div className="flex flex-wrap gap-1 mt-2">
										{photo.tags.slice(0, 3).map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
											>
												{tag}
											</span>
										))}
										{photo.tags.length > 3 && (
											<span className="text-xs text-gray-500">
												+{photo.tags.length - 3} more
											</span>
										)}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Upload Modal */}
			{showUploadModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
						<div className="flex justify-between items-center p-6 border-b">
							<h2 className="text-xl font-semibold text-gray-900">Upload Photos</h2>
							<button
								onClick={() => setShowUploadModal(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								<X className="h-6 w-6" />
							</button>
						</div>
						<div className="p-6">
							<div
								{...getRootProps()}
								className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
									isDragActive 
										? "border-blue-500 bg-blue-50" 
										: "border-gray-300 hover:border-gray-400"
								}`}
							>
								<input {...getInputProps()} />
								<Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
								{isDragActive ? (
									<p className="text-lg text-blue-600">Drop the photos here...</p>
								) : (
									<div>
										<p className="text-lg text-gray-900 mb-2">Drag & drop photos here</p>
										<p className="text-sm text-gray-500">or click to select files</p>
										<p className="text-xs text-gray-400 mt-2">
											Supports: JPG, PNG, GIF, WebP
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Tag Modal */}
			{showTagModal && selectedPhoto && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
						<div className="flex justify-between items-center p-6 border-b">
							<h2 className="text-xl font-semibold text-gray-900">Add Tags</h2>
							<button
								onClick={() => setShowTagModal(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								<X className="h-6 w-6" />
							</button>
						</div>
						<div className="p-6">
							<div className="mb-4">
								<p className="text-sm text-gray-600 mb-3">
									Select tags for: <span className="font-medium">{selectedPhoto.name}</span>
								</p>
								<div className="flex flex-wrap gap-2">
									{availableTags.map((tag) => (
										<button
											key={tag}
											type="button"
											onClick={() => toggleTag(tag)}
											className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
												selectedTags.includes(tag)
													? "bg-blue-600 text-white"
													: "bg-gray-100 text-gray-700 hover:bg-gray-200"
											}`}
										>
											{tag}
										</button>
									))}
								</div>
							</div>
							<div className="flex justify-end space-x-3">
								<Button 
									type="button" 
									variant="outline" 
									onClick={() => setShowTagModal(false)}
								>
									Cancel
								</Button>
								<Button onClick={handleSaveTags}>
									Save Tags
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
} 