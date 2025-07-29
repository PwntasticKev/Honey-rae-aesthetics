"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Instagram, Facebook, Youtube, Video, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialPlatform {
	_id: string;
	platform: string;
	accountName: string;
	isActive: boolean;
	lastSync?: number;
}

interface SocialPlatformConnectorProps {
	platforms: SocialPlatform[];
	onConnect: (platformId: string) => void;
	onDisconnect: (platformId: string) => void;
}

const platformConfigs = [
	{
		id: "instagram",
		name: "Instagram",
		icon: Instagram,
		color: "bg-gradient-to-r from-purple-500 to-pink-500",
		description: "Share photos and stories with your audience",
		features: ["Photo posts", "Stories", "Reels", "IGTV"],
		oauthUrl: "https://api.instagram.com/oauth/authorize",
	},
	{
		id: "facebook",
		name: "Facebook",
		icon: Facebook,
		color: "bg-gradient-to-r from-blue-500 to-blue-600",
		description: "Connect with your community on Facebook",
		features: ["Page posts", "Stories", "Live videos", "Groups"],
		oauthUrl: "https://www.facebook.com/v12.0/dialog/oauth",
	},
	{
		id: "tiktok",
		name: "TikTok",
		icon: Video,
		color: "bg-gradient-to-r from-black to-gray-800",
		description: "Create and share short-form videos",
		features: ["Short videos", "Trending content", "Duets", "Live streaming"],
		oauthUrl: "https://www.tiktok.com/auth/authorize",
	},
	{
		id: "youtube",
		name: "YouTube",
		icon: Youtube,
		color: "bg-gradient-to-r from-red-500 to-red-600",
		description: "Upload and manage your video content",
		features: ["Video uploads", "Live streaming", "Shorts", "Community posts"],
		oauthUrl: "https://accounts.google.com/o/oauth2/auth",
	},
];

export function SocialPlatformConnector({
	platforms,
	onConnect,
	onDisconnect,
}: SocialPlatformConnectorProps) {
	const [connecting, setConnecting] = useState<string | null>(null);

	const handleConnect = async (platformId: string) => {
		setConnecting(platformId);
		
		// Simulate OAuth flow
		setTimeout(() => {
			onConnect(platformId);
			setConnecting(null);
		}, 2000);
	};

	const handleDisconnect = (platformId: string) => {
		onDisconnect(platformId);
	};

	const getPlatformConfig = (platformId: string) => {
		return platformConfigs.find(p => p.id === platformId);
	};

	const isConnected = (platformId: string) => {
		return platforms.some(p => p.platform === platformId && p.isActive);
	};

	const getConnectedPlatform = (platformId: string) => {
		return platforms.find(p => p.platform === platformId);
	};

	return (
		<div className="space-y-6">
			{/* Connection Status */}
			<Card>
				<CardHeader>
					<CardTitle>Platform Connections</CardTitle>
					<CardDescription>
						Connect your social media accounts to schedule posts automatically
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{platformConfigs.map((platform) => {
							const Icon = platform.icon;
							const connected = isConnected(platform.id);
							const connectedPlatform = getConnectedPlatform(platform.id);
							
							return (
								<Card key={platform.id} className="border-2">
									<CardHeader className="pb-3">
										<div className="flex items-center space-x-3">
											<div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", platform.color)}>
												<Icon className="w-5 h-5 text-white" />
											</div>
											<div className="flex-1">
												<h3 className="font-medium">{platform.name}</h3>
												{connected ? (
													<div className="flex items-center space-x-1">
														<CheckCircle className="w-3 h-3 text-green-500" />
														<span className="text-xs text-green-600">Connected</span>
													</div>
												) : (
													<div className="flex items-center space-x-1">
														<AlertCircle className="w-3 h-3 text-gray-400" />
														<span className="text-xs text-gray-500">Not connected</span>
													</div>
												)}
											</div>
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										{connected ? (
											<div className="space-y-3">
												<div className="text-sm">
													<p className="font-medium">{connectedPlatform?.accountName}</p>
													<p className="text-xs text-gray-500">
														Last synced: {connectedPlatform?.lastSync 
															? new Date(connectedPlatform.lastSync).toLocaleDateString()
															: "Never"
														}
													</p>
												</div>
												<Button
													variant="outline"
													size="sm"
													className="w-full"
													onClick={() => handleDisconnect(platform.id)}
												>
													Disconnect
												</Button>
											</div>
										) : (
											<div className="space-y-3">
												<p className="text-xs text-gray-600">{platform.description}</p>
												<Button
													size="sm"
													className="w-full"
													onClick={() => handleConnect(platform.id)}
													disabled={connecting === platform.id}
												>
													{connecting === platform.id ? (
														<div className="flex items-center space-x-2">
															<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
															<span>Connecting...</span>
														</div>
													) : (
														<div className="flex items-center space-x-2">
															<ExternalLink className="w-4 h-4" />
															<span>Connect</span>
														</div>
													)}
												</Button>
											</div>
										)}
									</CardContent>
								</Card>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* Platform Features */}
			<Card>
				<CardHeader>
					<CardTitle>Platform Features</CardTitle>
					<CardDescription>What you can do with each platform</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{platformConfigs.map((platform) => {
							const Icon = platform.icon;
							const connected = isConnected(platform.id);
							
							return (
								<div key={platform.id} className="space-y-3">
									<div className="flex items-center space-x-3">
										<div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", platform.color)}>
											<Icon className="w-4 h-4 text-white" />
										</div>
										<div>
											<h3 className="font-medium">{platform.name}</h3>
											<p className="text-sm text-gray-600">{platform.description}</p>
										</div>
										{connected && (
											<Badge variant="secondary" className="ml-auto">
												Connected
											</Badge>
										)}
									</div>
									
									<div className="grid grid-cols-2 gap-2">
										{platform.features.map((feature) => (
											<div key={feature} className="flex items-center space-x-2">
												<CheckCircle className="w-3 h-3 text-green-500" />
												<span className="text-xs">{feature}</span>
											</div>
										))}
									</div>
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
					<div className="space-y-4">
						<div className="flex items-start space-x-3">
							<div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
								<span className="text-xs font-medium text-blue-600">1</span>
							</div>
							<div>
								<h4 className="font-medium text-sm">Use Business Accounts</h4>
								<p className="text-xs text-gray-600">
									Connect business accounts rather than personal accounts for better analytics and features.
								</p>
							</div>
						</div>
						
						<div className="flex items-start space-x-3">
							<div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
								<span className="text-xs font-medium text-blue-600">2</span>
							</div>
							<div>
								<h4 className="font-medium text-sm">Grant Necessary Permissions</h4>
								<p className="text-xs text-gray-600">
									Allow posting permissions so we can schedule and publish content on your behalf.
								</p>
							</div>
						</div>
						
						<div className="flex items-start space-x-3">
							<div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
								<span className="text-xs font-medium text-blue-600">3</span>
							</div>
							<div>
								<h4 className="font-medium text-sm">Keep Connected</h4>
								<p className="text-xs text-gray-600">
									Reconnect accounts if you change passwords or if tokens expire.
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 