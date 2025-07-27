"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
	Plus, 
	Calendar, 
	Instagram, 
	Facebook, 
	Twitter, 
	Linkedin,
	Image as ImageIcon,
	Edit,
	Trash2,
	Share2,
	Clock,
	CheckCircle,
	XCircle
} from "lucide-react";

interface SocialMediaManagerProps {
	onCreatePost: () => void;
	onEditPost: (postId: string) => void;
	onDeletePost: (postId: string) => void;
}

// Mock data for demonstration
const mockPosts = [
	{
		id: "1",
		content: "Transform your look with our latest aesthetic treatments! ✨ #HoneyRaeAesthetics #BeautyTransformation",
		image: "/api/placeholder/400/300",
		platforms: ["instagram", "facebook"],
		scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
		status: "scheduled",
		engagement: { likes: 45, comments: 12, shares: 8 }
	},
	{
		id: "2",
		content: "Before & After: Amazing results from our Botox treatment! See the difference? 👀",
		image: "/api/placeholder/400/300",
		platforms: ["instagram"],
		scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
		status: "draft",
		engagement: null
	},
	{
		id: "3",
		content: "New client special! 20% off your first consultation. Book now! 📞",
		image: "/api/placeholder/400/300",
		platforms: ["facebook", "twitter"],
		scheduledFor: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
		status: "published",
		engagement: { likes: 89, comments: 23, shares: 15 }
	}
];

export function SocialMediaManager({ onCreatePost, onEditPost, onDeletePost }: SocialMediaManagerProps) {
	const [selectedStatus, setSelectedStatus] = useState("all");
	const [selectedPlatform, setSelectedPlatform] = useState("all");

	const getPlatformIcon = (platform: string) => {
		switch (platform) {
			case "instagram":
				return <Instagram className="h-4 w-4" />;
			case "facebook":
				return <Facebook className="h-4 w-4" />;
			case "twitter":
				return <Twitter className="h-4 w-4" />;
			case "linkedin":
				return <Linkedin className="h-4 w-4" />;
			default:
				return <Share2 className="h-4 w-4" />;
		}
	};

	const getPlatformColor = (platform: string) => {
		switch (platform) {
			case "instagram":
				return "bg-gradient-to-r from-purple-500 to-pink-500";
			case "facebook":
				return "bg-blue-600";
			case "twitter":
				return "bg-blue-400";
			case "linkedin":
				return "bg-blue-700";
			default:
				return "bg-gray-500";
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "published":
				return "bg-green-100 text-green-800";
			case "scheduled":
				return "bg-blue-100 text-blue-800";
			case "draft":
				return "bg-gray-100 text-gray-800";
			case "failed":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "published":
				return <CheckCircle className="h-4 w-4" />;
			case "scheduled":
				return <Clock className="h-4 w-4" />;
			case "draft":
				return <Edit className="h-4 w-4" />;
			case "failed":
				return <XCircle className="h-4 w-4" />;
			default:
				return <Clock className="h-4 w-4" />;
		}
	};

	const filteredPosts = mockPosts.filter(post => {
		const matchesStatus = selectedStatus === "all" || post.status === selectedStatus;
		const matchesPlatform = selectedPlatform === "all" || post.platforms.includes(selectedPlatform);
		return matchesStatus && matchesPlatform;
	});

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
				<div>
					<h2 className="text-xl font-semibold text-gray-900">Social Media Manager</h2>
					<p className="text-sm text-gray-500">
						Schedule and manage your social media content
					</p>
				</div>
				
				<Button onClick={onCreatePost} className="flex items-center space-x-2">
					<Plus className="h-4 w-4" />
					<span>Create Post</span>
				</Button>
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<select
					value={selectedStatus}
					onChange={(e) => setSelectedStatus(e.target.value)}
					className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="all">All Status</option>
					<option value="draft">Draft</option>
					<option value="scheduled">Scheduled</option>
					<option value="published">Published</option>
					<option value="failed">Failed</option>
				</select>

				<select
					value={selectedPlatform}
					onChange={(e) => setSelectedPlatform(e.target.value)}
					className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="all">All Platforms</option>
					<option value="instagram">Instagram</option>
					<option value="facebook">Facebook</option>
					<option value="twitter">Twitter</option>
					<option value="linkedin">LinkedIn</option>
				</select>
			</div>

			{/* Post Count */}
			<div className="text-sm text-gray-600">
				{filteredPosts.length} of {mockPosts.length} posts
			</div>

			{/* Posts Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredPosts.map((post) => (
					<div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
						{/* Image */}
						<div className="relative h-48 bg-gray-200">
							<div className="absolute inset-0 flex items-center justify-center">
								<ImageIcon className="h-12 w-12 text-gray-400" />
							</div>
							
							{/* Platforms */}
							<div className="absolute top-2 left-2 flex space-x-1">
								{post.platforms.map((platform) => (
									<div
										key={platform}
										className={`p-1 rounded-full text-white ${getPlatformColor(platform)}`}
									>
										{getPlatformIcon(platform)}
									</div>
								))}
							</div>

							{/* Status */}
							<div className="absolute top-2 right-2">
								<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(post.status)}`}>
									{getStatusIcon(post.status)}
									<span className="ml-1 capitalize">{post.status}</span>
								</span>
							</div>
						</div>

						{/* Content */}
						<div className="p-4">
							<p className="text-sm text-gray-900 mb-3 line-clamp-3">
								{post.content}
							</p>

							{/* Scheduled Time */}
							<div className="flex items-center text-xs text-gray-500 mb-3">
								<Calendar className="h-3 w-3 mr-1" />
								{post.scheduledFor.toLocaleDateString()} at {post.scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
							</div>

							{/* Engagement */}
							{post.engagement && (
								<div className="flex items-center justify-between text-xs text-gray-500 mb-3">
									<span>❤️ {post.engagement.likes}</span>
									<span>💬 {post.engagement.comments}</span>
									<span>🔄 {post.engagement.shares}</span>
								</div>
							)}

							{/* Actions */}
							<div className="flex justify-end space-x-2">
								<button
									onClick={() => onEditPost(post.id)}
									className="text-blue-600 hover:text-blue-900 p-1"
									title="Edit post"
								>
									<Edit className="h-4 w-4" />
								</button>
								<button
									onClick={() => onDeletePost(post.id)}
									className="text-red-600 hover:text-red-900 p-1"
									title="Delete post"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Empty State */}
			{filteredPosts.length === 0 && (
				<div className="text-center py-12">
					<Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						No posts found
					</h3>
					<p className="text-gray-500 mb-4">
						{mockPosts.length === 0 
							? "Create your first social media post to get started."
							: "Try adjusting your filters to see more posts."
						}
					</p>
					{mockPosts.length === 0 && (
						<Button onClick={onCreatePost}>
							Create Post
						</Button>
					)}
				</div>
			)}
		</div>
	);
} 