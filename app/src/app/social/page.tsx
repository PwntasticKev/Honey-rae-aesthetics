"use client";

import { useState } from "react";
import { AuthWrapper } from "@/components/AuthWrapper";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Menu,
  Instagram,
  Facebook,
  Youtube,
  MessageSquare,
  Plus,
  Calendar,
  Clock,
  Users,
  Heart,
  Share2,
  BarChart3,
  Image,
  Video,
  Settings,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  Eye,
  Play,
  Pause,
  Edit,
  Trash2,
} from "lucide-react";

interface SocialAccount {
  id: string;
  platform: 'instagram' | 'facebook' | 'youtube' | 'tiktok';
  username: string;
  followers: number;
  connected: boolean;
  lastSync: string;
}

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  media?: string[];
  scheduledFor?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  publishedAt?: string;
}

interface SocialAnalytics {
  totalFollowers: number;
  followersGrowth: number;
  totalEngagement: number;
  engagementRate: number;
  topPlatform: string;
  recentPosts: number;
}

export default function SocialPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Mock data
  const [accounts] = useState<SocialAccount[]>([
    {
      id: "1",
      platform: "instagram",
      username: "@honeyrae_aesthetics",
      followers: 15420,
      connected: true,
      lastSync: "2025-10-14T10:30:00Z",
    },
    {
      id: "2",
      platform: "facebook",
      username: "Honey Rae Aesthetics",
      followers: 8750,
      connected: true,
      lastSync: "2025-10-14T10:25:00Z",
    },
    {
      id: "3",
      platform: "youtube",
      username: "Honey Rae Aesthetics",
      followers: 3200,
      connected: false,
      lastSync: "",
    },
    {
      id: "4",
      platform: "tiktok",
      username: "@honeyrae",
      followers: 22100,
      connected: true,
      lastSync: "2025-10-14T10:20:00Z",
    },
  ]);

  const [posts] = useState<SocialPost[]>([
    {
      id: "1",
      platform: "Instagram",
      content: "Beautiful results from our latest facial treatment! ✨ Book your appointment today.",
      media: ["before_after_1.jpg"],
      status: "published",
      engagement: { likes: 245, comments: 18, shares: 12, views: 1820 },
      publishedAt: "2025-10-14T09:00:00Z",
    },
    {
      id: "2",
      platform: "Facebook",
      content: "Special promotion this week - 20% off all facial treatments!",
      status: "scheduled",
      scheduledFor: "2025-10-15T14:00:00Z",
    },
    {
      id: "3",
      platform: "TikTok",
      content: "Day in the life of an aesthetic nurse 💉",
      media: ["day_in_life.mp4"],
      status: "draft",
    },
  ]);

  const analytics: SocialAnalytics = {
    totalFollowers: 49470,
    followersGrowth: 8.5,
    totalEngagement: 15630,
    engagementRate: 4.2,
    topPlatform: "TikTok",
    recentPosts: 12,
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'facebook':
        return <Facebook className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      case 'tiktok':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <Share2 className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800"><Edit className="h-3 w-3 mr-1" />Draft</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 mr-1" />Unknown</Badge>;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-white">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex flex-col lg:ml-48">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between pl-0 pr-6 h-16">
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Social Media</h1>
                  <p className="text-sm text-gray-600">Manage and schedule social media content</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button className="bg-black text-white hover:bg-gray-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 section-padding">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="accounts">Accounts</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Followers
                      </CardTitle>
                      <Users className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-black">
                        {formatNumber(analytics.totalFollowers)}
                      </div>
                      <p className="text-xs text-green-600">
                        +{analytics.followersGrowth}% this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Engagement
                      </CardTitle>
                      <Heart className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-black">
                        {formatNumber(analytics.totalEngagement)}
                      </div>
                      <p className="text-xs text-green-600">
                        {analytics.engagementRate}% engagement rate
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Top Platform
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-black">
                        {analytics.topPlatform}
                      </div>
                      <p className="text-xs text-blue-600">
                        Highest engagement
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Recent Posts
                      </CardTitle>
                      <Share2 className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-black">
                        {analytics.recentPosts}
                      </div>
                      <p className="text-xs text-gray-600">
                        This month
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Connected Accounts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Connected Accounts</CardTitle>
                    <CardDescription>
                      Manage your social media platform connections
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {accounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {getPlatformIcon(account.platform)}
                            <div>
                              <p className="font-medium text-black">
                                {account.username}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatNumber(account.followers)} followers
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {account.connected ? (
                              <Badge className="bg-green-100 text-green-800">
                                Connected
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                Disconnected
                              </Badge>
                            )}
                            <Button variant="outline" size="sm">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Posts Tab */}
              <TabsContent value="posts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Recent Posts</CardTitle>
                        <CardDescription>
                          Manage your published and draft content
                        </CardDescription>
                      </div>
                      <Button className="bg-black text-white hover:bg-gray-800">
                        <Plus className="h-4 w-4 mr-2" />
                        New Post
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <div
                          key={post.id}
                          className="border border-gray-200 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              {getPlatformIcon(post.platform)}
                              <div>
                                <p className="font-medium text-black">
                                  {post.platform}
                                </p>
                                {post.scheduledFor && (
                                  <p className="text-sm text-gray-600">
                                    Scheduled for {formatDate(post.scheduledFor)}
                                  </p>
                                )}
                                {post.publishedAt && (
                                  <p className="text-sm text-gray-600">
                                    Published {formatDate(post.publishedAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(post.status)}
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-900">{post.content}</p>
                          {post.engagement && (
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Heart className="h-4 w-4" />
                                <span>{post.engagement.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{post.engagement.comments}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Share2 className="h-4 w-4" />
                                <span>{post.engagement.shares}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>{formatNumber(post.engagement.views)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Post Scheduler</CardTitle>
                    <CardDescription>
                      Schedule your social media content across platforms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Select Platform
                          </label>
                          <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md">
                            <option>Instagram</option>
                            <option>Facebook</option>
                            <option>TikTok</option>
                            <option>All Platforms</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Post Content
                          </label>
                          <Textarea
                            placeholder="Write your post content here..."
                            className="mt-1"
                            rows={4}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Schedule Date & Time
                          </label>
                          <Input
                            type="datetime-local"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex space-x-3">
                          <Button className="bg-black text-white hover:bg-gray-800">
                            Schedule Post
                          </Button>
                          <Button variant="outline">
                            Save as Draft
                          </Button>
                        </div>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-black mb-3">Preview</h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Instagram className="h-5 w-5" />
                            <span className="font-medium">@honeyrae_aesthetics</span>
                          </div>
                          <p className="text-gray-900">
                            Your post content will appear here...
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>❤️ 0 likes</span>
                            <span>💬 0 comments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Accounts Tab */}
              <TabsContent value="accounts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Accounts</CardTitle>
                    <CardDescription>
                      Connect and manage your social media platform accounts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {accounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-6 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                              {getPlatformIcon(account.platform)}
                            </div>
                            <div>
                              <h3 className="font-medium text-black capitalize">
                                {account.platform}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {account.connected ? account.username : 'Not connected'}
                              </p>
                              {account.connected && (
                                <p className="text-xs text-gray-500">
                                  {formatNumber(account.followers)} followers • Last sync: {formatDate(account.lastSync)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {account.connected ? (
                              <>
                                <Badge className="bg-green-100 text-green-800">
                                  Connected
                                </Badge>
                                <Button variant="outline" size="sm">
                                  Disconnect
                                </Button>
                              </>
                            ) : (
                              <Button className="bg-black text-white hover:bg-gray-800">
                                Connect
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Connect more platforms</p>
                        <Button className="mt-3 bg-black text-white hover:bg-gray-800">
                          Add Platform
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </AuthWrapper>
  );
}
