"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Instagram, Facebook, Youtube, Video, Image, FileText, Clock, Settings, BarChart3, Upload, X, Eye, Heart, MessageCircle, Share2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { socialMediaService, ConnectionStatus } from "@/lib/socialMediaService";

interface SocialPost {
	_id: string;
	title: string;
	content: string;
	mediaUrls: string[];
	scheduledAt: number;
	platforms: string[];
	status: "draft" | "scheduled" | "published" | "failed" | "cancelled";
	createdAt: number;
	updatedAt: number;
}

interface SocialPlatform {
	_id: string;
	platform: string;
	accountName: string;
	isActive: boolean;
}

const platforms = [
	{ id: "instagram", name: "Instagram", icon: Instagram, color: "bg-gradient-to-r from-purple-500 to-pink-500" },
	{ id: "facebook", name: "Facebook", icon: Facebook, color: "bg-gradient-to-r from-blue-500 to-blue-600" },
	{ id: "tiktok", name: "TikTok", icon: Video, color: "bg-gradient-to-r from-black to-gray-800" },
	{ id: "youtube", name: "YouTube", icon: Youtube, color: "bg-gradient-to-r from-red-500 to-red-600" },
];

interface SocialMediaSchedulerProps {
	posts: SocialPost[];
	connectedPlatforms: SocialPlatform[];
	onCreatePost: (post: Omit<SocialPost, "_id" | "createdAt" | "updatedAt">) => void;
	onUpdatePost: (postId: string, updates: Partial<SocialPost>) => void;
	onDeletePost: (postId: string) => void;
}

export function SocialMediaScheduler({
	posts,
	connectedPlatforms,
	onCreatePost,
	onUpdatePost,
	onDeletePost,
}: SocialMediaSchedulerProps) {
	const [showCreatePost, setShowCreatePost] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date>();
	const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
	const [newPost, setNewPost] = useState({
		title: "",
		content: "",
		mediaUrls: [] as string[],
		scheduledAt: Date.now(),
		platforms: [] as string[],
	});
	const [dragOver, setDragOver] = useState(false);
	const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
	const [showAnalytics, setShowAnalytics] = useState(true);
	const [platformConnections, setPlatformConnections] = useState<Map<string, ConnectionStatus>>(new Map());

	useEffect(() => {
		// Load existing connections
		loadConnections();
	}, []);

	const loadConnections = async () => {
		try {
			const connections = await socialMediaService.getAllConnections();
			const connectionsMap = new Map();
			connections.forEach(conn => connectionsMap.set(conn.platformId, conn));
			setPlatformConnections(connectionsMap);
		} catch (error) {
			console.error('Failed to load connections:', error);
		}
	};

	const handleCreatePost = () => {
		console.log('handleCreatePost called with:', newPost);
		if (newPost.title && newPost.content && newPost.platforms.length > 0) {
			const postToCreate = {
				...newPost,
				status: "draft" as const,
			};
			console.log('Creating post:', postToCreate);
			onCreatePost(postToCreate);
			setNewPost({
				title: "",
				content: "",
				mediaUrls: [],
				scheduledAt: Date.now(),
				platforms: [],
			});
			setShowCreatePost(false);
		} else {
			console.log('Validation failed:', { title: newPost.title, content: newPost.content, platforms: newPost.platforms });
		}
	};

	const handleEditPost = (post: SocialPost) => {
		setEditingPost(post);
		setNewPost({
			title: post.title,
			content: post.content,
			mediaUrls: post.mediaUrls,
			scheduledAt: post.scheduledAt,
			platforms: post.platforms,
		});
		setShowCreatePost(true);
	};

	const handleUpdatePost = () => {
		if (editingPost && newPost.title && newPost.content && newPost.platforms.length > 0) {
			onUpdatePost(editingPost._id, {
				...newPost,
				status: editingPost.status,
			});
			setEditingPost(null);
			setNewPost({
				title: "",
				content: "",
				mediaUrls: [],
				scheduledAt: Date.now(),
				platforms: [],
			});
			setShowCreatePost(false);
		}
	};

	const handlePlatformToggle = (platformId: string) => {
		setNewPost(prev => ({
			...prev,
			platforms: prev.platforms.includes(platformId)
				? prev.platforms.filter(p => p !== platformId)
				: [...prev.platforms, platformId]
		}));
	};

	const handleFileUpload = (files: FileList) => {
		const urls = Array.from(files).map(file => URL.createObjectURL(file));
		setNewPost(prev => ({
			...prev,
			mediaUrls: [...prev.mediaUrls, ...urls]
		}));
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			handleFileUpload(files);
		}
	};

	const handlePlatformConnection = async (platformId: string) => {
		console.log('Connecting platform:', platformId);
		setConnectingPlatform(platformId);
		
		try {
			const connection = await socialMediaService.connectPlatform(platformId);
			setPlatformConnections(prev => new Map(prev.set(platformId, connection)));
			console.log('Connection complete for:', platformId);
		} catch (error) {
			console.error('Failed to connect platform:', platformId, error);
		} finally {
			setConnectingPlatform(null);
		}
	};

	const handlePlatformDisconnection = async (platformId: string) => {
		try {
			await socialMediaService.disconnectPlatform(platformId);
			setPlatformConnections(prev => {
				const newMap = new Map(prev);
				newMap.delete(platformId);
				return newMap;
			});
		} catch (error) {
			console.error('Failed to disconnect platform:', platformId, error);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "published": return "bg-green-100 text-green-800";
			case "scheduled": return "bg-blue-100 text-blue-800";
			case "draft": return "bg-gray-100 text-gray-800";
			case "failed": return "bg-red-100 text-red-800";
			default: return "bg-gray-100 text-gray-800";
		}
	};

	const getPlatformIcon = (platformId: string) => {
		const platform = platforms.find(p => p.id === platformId);
		return platform?.icon || Instagram;
	};

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card data-testid="stats-card">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Posts</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{posts.length}</div>
						<p className="text-xs text-muted-foreground">+2 from last week</p>
					</CardContent>
				</Card>
				
				<Card data-testid="stats-card">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Scheduled</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{posts.filter(p => p.status === "scheduled").length}</div>
						<p className="text-xs text-muted-foreground">Next post in 2 hours</p>
					</CardContent>
				</Card>
				
				<Card data-testid="stats-card">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Connected Platforms</CardTitle>
						<Settings className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{connectedPlatforms.length}</div>
						<p className="text-xs text-muted-foreground">4 platforms available</p>
					</CardContent>
				</Card>
				
				<Card data-testid="stats-card">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">2.4K</div>
						<p className="text-xs text-muted-foreground">+12% from last month</p>
					</CardContent>
				</Card>
			</div>

			{/* Analytics Section */}
			{showAnalytics && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Platform Performance</CardTitle>
							<CardDescription>Detailed metrics for each connected platform</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{platforms.map((platform) => {
									const Icon = platform.icon;
									const isConnected = platformConnections.has(platform.id);
									
									return (
										<div key={platform.id} className="flex items-center justify-between p-3 border rounded-lg">
											<div className="flex items-center space-x-3">
												<Icon className="w-5 h-5" />
												<span className="font-medium">{platform.name}</span>
											</div>
											<div className="text-right">
												<div className="font-bold">{isConnected ? "2.1K" : "0"}</div>
												<div className="text-xs text-gray-500">views</div>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Engagement Breakdown</CardTitle>
							<CardDescription>Detailed engagement metrics</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Heart className="w-4 h-4 text-red-500" />
										<span>Total Likes</span>
									</div>
									<span className="font-bold">1.2K</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<MessageCircle className="w-4 h-4 text-blue-500" />
										<span>Total Comments</span>
									</div>
									<span className="font-bold">456</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Share2 className="w-4 h-4 text-green-500" />
										<span>Total Shares</span>
									</div>
									<span className="font-bold">234</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Eye className="w-4 h-4 text-purple-500" />
										<span>Total Views</span>
									</div>
									<span className="font-bold">8.5K</span>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<BarChart3 className="w-4 h-4 text-orange-500" />
										<span>Avg. Engagement Rate</span>
									</div>
									<span className="font-bold">4.2%</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Connected Platforms */}
			<Card>
				<CardHeader>
					<CardTitle>Connected Platforms</CardTitle>
					<CardDescription>Manage your social media accounts</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{platforms.map((platform) => {
							const isConnected = platformConnections.has(platform.id);
							const connection = platformConnections.get(platform.id);
							const Icon = platform.icon;
							const isConnecting = connectingPlatform === platform.id;
							
							return (
								<div
									key={platform.id}
									className={cn(
										"p-4 rounded-lg border-2 cursor-pointer transition-all",
										isConnected
											? "border-green-500 bg-green-50"
											: "border-gray-200 hover:border-gray-300"
									)}
								>
									<div className="flex items-center space-x-3">
										<div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", platform.color)}>
											<Icon className="w-5 h-5 text-white" />
										</div>
										<div>
											<h3 className="font-medium">{platform.name}</h3>
											<p className="text-sm text-gray-500">
												{isConnecting ? "Connecting..." : isConnected ? connection?.accountName || "Connected" : "Not connected"}
											</p>
										</div>
									</div>
									<Button
										variant={isConnected ? "outline" : "default"}
										size="sm"
										className="mt-3 w-full"
										onClick={() => isConnected ? handlePlatformDisconnection(platform.id) : handlePlatformConnection(platform.id)}
										disabled={isConnecting}
									>
										{isConnecting ? "Connecting..." : isConnected ? "Disconnect" : "Connect"}
									</Button>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* Platform Features */}
			<Card>
				<CardHeader>
					<CardTitle>Platform Features</CardTitle>
					<CardDescription>Available features for each platform</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{platforms.map((platform) => {
							const Icon = platform.icon;
							const features = platform.id === "instagram" ? ["Photo posts", "Stories", "Reels"] :
											platform.id === "facebook" ? ["Photo posts", "Video uploads", "Live streaming"] :
											platform.id === "tiktok" ? ["Short videos", "Duets", "Trending sounds"] :
											["Video uploads", "Live streaming", "Community posts"];
							
							return (
								<div key={platform.id} className="p-4 border rounded-lg">
									<div className="flex items-center space-x-2 mb-3">
										<Icon className="w-5 h-5" />
										<h3 className="font-medium">{platform.name}</h3>
									</div>
									<ul className="space-y-1 text-sm text-gray-600">
										{features.map((feature, index) => (
											<li key={index} className="flex items-center space-x-2">
												<div className="w-1 h-1 bg-green-500 rounded-full"></div>
												<span>{feature}</span>
											</li>
										))}
									</ul>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* Connection Tips */}
			<Card>
				<CardHeader>
					<CardTitle>Connection Tips</CardTitle>
					<CardDescription>Best practices for connecting your social media accounts</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="p-4 border rounded-lg">
							<h4 className="font-medium mb-2">Use Business Accounts</h4>
							<p className="text-sm text-gray-600">Connect business accounts for better analytics and features</p>
						</div>
						<div className="p-4 border rounded-lg">
							<h4 className="font-medium mb-2">Grant Necessary Permissions</h4>
							<p className="text-sm text-gray-600">Allow posting and analytics access for full functionality</p>
						</div>
						<div className="p-4 border rounded-lg">
							<h4 className="font-medium mb-2">Keep Connected</h4>
							<p className="text-sm text-gray-600">Regularly refresh connections to maintain access</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Create Post */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</CardTitle>
							<CardDescription>Schedule content for your social media platforms</CardDescription>
						</div>
						<Button onClick={() => {
							setShowCreatePost(!showCreatePost);
							if (!showCreatePost) {
								setEditingPost(null);
								setNewPost({
									title: "",
									content: "",
									mediaUrls: [],
									scheduledAt: Date.now(),
									platforms: [],
								});
							}
						}}>
							<Plus className="w-4 h-4 mr-2" />
							{showCreatePost ? "Cancel" : "Create Post"}
						</Button>
					</div>
				</CardHeader>
				{showCreatePost && (
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Post Content */}
							<div className="space-y-4">
								<div>
									<label className="text-sm font-medium">Title</label>
									<Input
										placeholder="Enter post title..."
										value={newPost.title}
										onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
									/>
								</div>
								
								<div>
									<label className="text-sm font-medium">Content</label>
									<Textarea
										placeholder="Write your post content..."
										rows={4}
										value={newPost.content}
										onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
									/>
								</div>
								
								<div>
									<label className="text-sm font-medium">Media</label>
									<div
										className={cn(
											"border-2 border-dashed rounded-lg p-6 text-center transition-all",
											dragOver
												? "border-orange-500 bg-orange-50"
												: "border-gray-300 hover:border-gray-400"
										)}
										onDragOver={handleDragOver}
										onDragLeave={handleDragLeave}
										onDrop={handleDrop}
									>
										<Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
										<p className="text-sm text-gray-500">Drag and drop images/videos here</p>
										<p className="text-xs text-gray-400">or click to browse</p>
										<input
											type="file"
											multiple
											accept="image/*,video/*"
											className="hidden"
											onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
										/>
									</div>
									
									{/* Media Preview */}
									{newPost.mediaUrls.length > 0 && (
										<div className="mt-4 grid grid-cols-2 gap-2">
											{newPost.mediaUrls.map((url, index) => (
												<div key={index} className="relative">
													<img
														src={url}
														alt={`Media ${index + 1}`}
														className="w-full h-24 object-cover rounded-lg"
													/>
													<button
														onClick={() => setNewPost(prev => ({
															...prev,
															mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
														}))}
														className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
													>
														<X className="w-3 h-3" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
							
							{/* Scheduling & Platforms */}
							<div className="space-y-4">
								<div>
									<label className="text-sm font-medium">Schedule</label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												className="w-full justify-start text-left font-normal"
											>
												<CalendarIcon className="mr-2 h-4 w-4" />
												{selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0">
											<Calendar
												mode="single"
												selected={selectedDate}
												onSelect={setSelectedDate}
												initialFocus
												className="[&_.rdp-day]:data-[testid=calendar-day]"
											/>
										</PopoverContent>
									</Popover>
								</div>
								
								<div>
									<label className="text-sm font-medium">Platforms</label>
									<div className="grid grid-cols-2 gap-2 mt-2">
										{platforms.map((platform) => {
											const Icon = platform.icon;
											const isSelected = newPost.platforms.includes(platform.id);
											
											return (
												<button
													key={platform.id}
													onClick={() => handlePlatformToggle(platform.id)}
													className={cn(
														"p-3 rounded-lg border-2 transition-all flex items-center space-x-2",
														isSelected
															? "border-orange-500 bg-orange-50"
															: "border-gray-200 hover:border-gray-300"
													)}
												>
													<Icon className="w-4 h-4" />
													<span className="text-sm">{platform.name}</span>
												</button>
											);
										})}
									</div>
								</div>
								
								<Button 
									onClick={editingPost ? handleUpdatePost : handleCreatePost} 
									className="w-full"
								>
									{editingPost ? 'Update Post' : 'Schedule Post'}
								</Button>
							</div>
						</div>
					</CardContent>
				)}
			</Card>

			{/* Posts List */}
			<Card>
				<CardHeader>
					<CardTitle>Scheduled Posts</CardTitle>
					<CardDescription>Manage your upcoming and published content</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{posts.map((post) => (
							<div key={post._id} className="border rounded-lg p-4">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center space-x-2 mb-2">
											<h3 className="font-medium">{post.title}</h3>
											<Badge className={getStatusColor(post.status)} data-testid="post-status">
												{post.status}
											</Badge>
										</div>
										<p className="text-sm text-gray-600 mb-3">{post.content}</p>
										
										{/* Media Preview */}
										{post.mediaUrls.length > 0 && (
											<div className="flex space-x-2 mb-3">
												{post.mediaUrls.map((url, index) => (
													<img
														key={index}
														src={url}
														alt={`Media ${index + 1}`}
														className="w-16 h-16 object-cover rounded-lg"
													/>
												))}
											</div>
										)}
										
										<div className="flex items-center space-x-4 text-sm text-gray-500">
											<span>Scheduled: {new Date(post.scheduledAt).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'short',
												day: 'numeric',
												hour: 'numeric',
												minute: '2-digit',
												hour12: true
											})}</span>
											<div className="flex items-center space-x-1">
												{post.platforms.map((platformId) => {
													const Icon = getPlatformIcon(platformId);
													return <Icon key={platformId} className="w-4 h-4" data-testid="platform-icon" />;
												})}
											</div>
										</div>
									</div>
									
									<div className="flex items-center space-x-2">
										<Button variant="outline" size="sm" onClick={() => handleEditPost(post)}>
											Edit
										</Button>
										<Button 
											variant="outline" 
											size="sm"
											onClick={() => onDeletePost(post._id)}
										>
											Delete
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 