"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Eye, Heart, MessageCircle, Share2, Instagram, Facebook, Youtube, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
	totalPosts: number;
	publishedPosts: number;
	scheduledPosts: number;
	connectedPlatforms: number;
	totalLikes: number;
	totalComments: number;
	totalShares: number;
	totalViews: number;
	platformStats: {
		instagram: { posts: number; engagement: number; followers: number };
		facebook: { posts: number; engagement: number; followers: number };
		tiktok: { posts: number; engagement: number; followers: number };
		youtube: { posts: number; engagement: number; followers: number };
	};
}

interface SocialMediaAnalyticsProps {
	data: AnalyticsData;
}

const platforms = [
	{ id: "instagram", name: "Instagram", icon: Instagram, color: "bg-gradient-to-r from-purple-500 to-pink-500" },
	{ id: "facebook", name: "Facebook", icon: Facebook, color: "bg-gradient-to-r from-blue-500 to-blue-600" },
	{ id: "tiktok", name: "TikTok", icon: Video, color: "bg-gradient-to-r from-black to-gray-800" },
	{ id: "youtube", name: "YouTube", icon: Youtube, color: "bg-gradient-to-r from-red-500 to-red-600" },
];

export function SocialMediaAnalytics({ data }: SocialMediaAnalyticsProps) {
	const getPlatformIcon = (platformId: string) => {
		const platform = platforms.find(p => p.id === platformId);
		return platform?.icon || Instagram;
	};

	const getPlatformColor = (platformId: string) => {
		const platform = platforms.find(p => p.id === platformId);
		return platform?.color || "bg-gray-500";
	};

	return (
		<div className="space-y-6">
			{/* Overview Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Posts</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.totalPosts}</div>
						<p className="text-xs text-muted-foreground">+2 from last week</p>
					</CardContent>
				</Card>
				
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Views</CardTitle>
						<Eye className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.totalViews.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">+12% from last month</p>
					</CardContent>
				</Card>
				
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
						<Heart className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{(data.totalLikes + data.totalComments + data.totalShares).toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">+8% from last month</p>
					</CardContent>
				</Card>
				
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Avg. Engagement Rate</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data.totalViews > 0 
								? (((data.totalLikes + data.totalComments + data.totalShares) / data.totalViews) * 100).toFixed(1)
								: "0"
							}%
						</div>
						<p className="text-xs text-muted-foreground">+2.1% from last month</p>
					</CardContent>
				</Card>
			</div>

			{/* Platform Performance */}
			<Card>
				<CardHeader>
					<CardTitle>Platform Performance</CardTitle>
					<CardDescription>Detailed metrics for each connected platform</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{platforms.map((platform) => {
							const Icon = platform.icon;
							const stats = data.platformStats[platform.id as keyof typeof data.platformStats];
							
							return (
								<Card key={platform.id} className="border-2">
									<CardHeader className="pb-3">
										<div className="flex items-center space-x-3">
											<div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", platform.color)}>
												<Icon className="w-4 h-4 text-white" />
											</div>
											<div>
												<h3 className="font-medium text-sm">{platform.name}</h3>
												<p className="text-xs text-gray-500">{stats.followers.toLocaleString()} followers</p>
											</div>
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="space-y-2">
											<div className="flex justify-between text-sm">
												<span>Posts</span>
												<span className="font-medium">{stats.posts}</span>
											</div>
											<div className="flex justify-between text-sm">
												<span>Engagement</span>
												<span className="font-medium">{stats.engagement.toFixed(1)}%</span>
											</div>
											<div className="pt-2">
												<Badge variant="secondary" className="w-full justify-center">
													{stats.engagement > 5 ? "High" : stats.engagement > 2 ? "Medium" : "Low"} Performance
												</Badge>
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* Engagement Breakdown */}
			<Card>
				<CardHeader>
					<CardTitle>Engagement Breakdown</CardTitle>
					<CardDescription>Detailed breakdown of likes, comments, and shares</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="text-center">
							<div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-3">
								<Heart className="w-6 h-6 text-red-600" />
							</div>
							<div className="text-2xl font-bold text-red-600">{data.totalLikes.toLocaleString()}</div>
							<p className="text-sm text-gray-600">Total Likes</p>
						</div>
						
						<div className="text-center">
							<div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
								<MessageCircle className="w-6 h-6 text-blue-600" />
							</div>
							<div className="text-2xl font-bold text-blue-600">{data.totalComments.toLocaleString()}</div>
							<p className="text-sm text-gray-600">Total Comments</p>
						</div>
						
						<div className="text-center">
							<div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
								<Share2 className="w-6 h-6 text-green-600" />
							</div>
							<div className="text-2xl font-bold text-green-600">{data.totalShares.toLocaleString()}</div>
							<p className="text-sm text-gray-600">Total Shares</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 