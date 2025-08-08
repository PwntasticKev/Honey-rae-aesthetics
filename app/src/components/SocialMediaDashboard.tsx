"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, Calendar, Upload, Sparkles, BarChart3, Settings, 
  Instagram, Facebook, Youtube, Linkedin, Play, Image,
  Clock, CheckCircle, AlertCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Share2, Eye, Download, RefreshCw,
  Wand2, Hash, TrendingUp, Users, Heart, MessageCircle
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { PLATFORM_SPECS, validateMediaFile, getImageDimensions, processImageForPlatforms } from '@/lib/mediaUtils';

interface MediaFile {
  url: string;
  type: 'image' | 'video';
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface SocialPost {
  _id: string;
  title: string;
  content: string;
  hashtags: string[];
  mediaFiles: MediaFile[];
  targetPlatforms: string[];
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  scheduledFor?: number;
  timezone?: string;
  createdAt: number;
  updatedAt: number;
  creator?: { name: string; email: string };
}

interface ConnectedPlatform {
  _id: string;
  platform: string;
  accountName: string;
  isConnected: boolean;
  profileImageUrl?: string;
  followerCount?: number;
  config: {
    name: string;
    color: string;
    aspectRatios: string[];
    maxCharacters: number;
  };
}

export function SocialMediaDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  // Handle OAuth success/error from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const oauthError = urlParams.get('error');
    const platform = urlParams.get('platform');
    const account = urlParams.get('account');
    const message = urlParams.get('message');

    if (oauthSuccess === 'true' && platform && account) {
      alert(`Successfully connected to ${platform}! Account: ${account}`);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (oauthError && platform) {
      alert(`Failed to connect to ${platform}: ${message || 'Unknown error'}`);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Form state for creating/editing posts
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    hashtags: '',
    targetPlatforms: [] as string[],
    mediaFiles: [] as File[],
    scheduledDate: '',
    scheduledTime: '',
  });

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<{
    caption?: string;
    hashtags?: string[];
    loading?: boolean;
  }>({});

  // Queries
  const connectedPlatforms = useQuery(api.socialMedia.getConnectedPlatforms, 
    user?.orgId ? { orgId: user.orgId as any } : "skip"
  );

  const posts = useQuery(api.socialMedia.getPosts, 
    user?.orgId ? { 
      orgId: user.orgId as any,
      status: statusFilter !== 'all' ? statusFilter as any : undefined,
      platform: platformFilter !== 'all' ? platformFilter : undefined,
      limit: 20 
    } : "skip"
  );

  const analytics = useQuery(api.socialMedia.getAnalytics,
    user?.orgId ? { orgId: user.orgId as any } : "skip"
  );

  // Mutations
  const createPost = useMutation(api.socialMedia.createPost);
  const updatePost = useMutation(api.socialMedia.updatePost);
  const deletePost = useMutation(api.socialMedia.deletePost);
  const publishPost = useMutation(api.socialMedia.publishPostNow);
  const connectPlatform = useMutation(api.socialMedia.connectPlatform);
  const generateSuggestions = useMutation(api.aiSuggestions.generateContentSuggestions);

  // Platform icons mapping
  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, React.ReactNode> = {
      instagram: <Instagram className="h-4 w-4" />,
      facebook: <Facebook className="h-4 w-4" />,
      youtube: <Youtube className="h-4 w-4" />,
      linkedin: <Linkedin className="h-4 w-4" />,
      tiktok: <Play className="h-4 w-4" />,
    };
    return icons[platform] || <Share2 className="h-4 w-4" />;
  };

  // Status icons and colors
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      draft: { icon: <Edit className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      scheduled: { icon: <Clock className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      publishing: { icon: <RefreshCw className="h-4 w-4 animate-spin" />, color: 'bg-yellow-100 text-yellow-800', label: 'Publishing' },
      published: { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-100 text-green-800', label: 'Published' },
      failed: { icon: <XCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800', label: 'Failed' },
      cancelled: { icon: <AlertCircle className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800', label: 'Cancelled' },
    };
    return configs[status] || configs.draft;
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    const newFiles = Array.from(files);
    
    // Validate files
    for (const file of newFiles) {
      const validation = validateMediaFile(file, postForm.targetPlatforms);
      if (!validation.valid) {
        alert(`File ${file.name}: ${validation.errors.join(', ')}`);
        return;
      }
    }

    setPostForm(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, ...newFiles]
    }));
  }, [postForm.targetPlatforms]);

  // Handle platform connection
  const handleConnectPlatform = useCallback(async (platform: string) => {
    try {
      // Call the OAuth API route to get the authorization URL
      const response = await fetch(`/api/oauth/${platform}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate ${platform} OAuth`);
      }

      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (error) {
      console.error(`${platform} OAuth error:`, error);
      alert(`Failed to connect to ${platform}. Please ensure your API credentials are configured.`);
    }
  }, []);

  // Handle AI suggestions
  const handleAISuggestions = useCallback(async () => {
    if (!postForm.content && postForm.mediaFiles.length === 0) {
      alert('Please add content or upload media first');
      return;
    }

    setAiSuggestions({ loading: true });

    try {
      let imageDescription = '';
      if (postForm.mediaFiles.length > 0) {
        // For now, just use a generic description
        // In production, you'd analyze the actual image
        imageDescription = 'Professional aesthetic treatment result';
      }

      const suggestions = await generateSuggestions({
        content: postForm.content,
        imageDescription,
        platforms: postForm.targetPlatforms,
        businessType: 'aesthetics clinic',
        tone: 'professional',
      });

      setAiSuggestions({
        caption: suggestions.suggestedCaption,
        hashtags: suggestions.hashtags,
        loading: false,
      });
    } catch (error) {
      console.error('AI suggestions error:', error);
      setAiSuggestions({ loading: false });
    }
  }, [postForm.content, postForm.mediaFiles, postForm.targetPlatforms, generateSuggestions]);

  // Apply AI suggestions
  const applyAISuggestions = useCallback(() => {
    if (aiSuggestions.caption) {
      setPostForm(prev => ({ ...prev, content: aiSuggestions.caption || '' }));
    }
    if (aiSuggestions.hashtags) {
      setPostForm(prev => ({ ...prev, hashtags: aiSuggestions.hashtags?.join(' ') || '' }));
    }
    setAiSuggestions({});
  }, [aiSuggestions]);

  // Handle post creation
  const handleCreatePost = useCallback(async () => {
    if (!user?.orgId || !user.userId) return;

    try {
      // Process media files (in production, upload to storage first)
      const mediaFiles: MediaFile[] = postForm.mediaFiles.map(file => ({
        url: URL.createObjectURL(file), // In production: upload and get real URL
        type: file.type.startsWith('video/') ? 'video' : 'image',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }));

      let scheduledFor: number | undefined;
      if (postForm.scheduledDate && postForm.scheduledTime) {
        const dateTime = new Date(`${postForm.scheduledDate}T${postForm.scheduledTime}`);
        scheduledFor = dateTime.getTime();
      }

      await createPost({
        orgId: user.orgId as any,
        userId: user.userId as any,
        title: postForm.title,
        content: postForm.content,
        hashtags: postForm.hashtags.split(/\s+/).filter(tag => tag.startsWith('#')),
        targetPlatforms: postForm.targetPlatforms,
        mediaFiles,
        scheduledFor,
        timezone: 'America/Denver',
      });

      // Reset form
      setPostForm({
        title: '',
        content: '',
        hashtags: '',
        targetPlatforms: [],
        mediaFiles: [],
        scheduledDate: '',
        scheduledTime: '',
      });
      setShowCreatePost(false);
      setAiSuggestions({});
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  }, [user, postForm, createPost]);

  if (!user) {
    return <div>Please log in to access social media management.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Media Management</h2>
          <p className="text-gray-600">Schedule, publish, and analyze your social media content</p>
        </div>
        <Button onClick={() => setShowCreatePost(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Post
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Connected Platforms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Connected Platforms
              </CardTitle>
              <CardDescription>
                Manage your social media platform connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['instagram', 'facebook', 'youtube', 'linkedin', 'tiktok', 'google_business', 'apple_business'].map(platform => {
                  const connected = connectedPlatforms?.find(p => p.platform === platform);
                  const config = PLATFORM_SPECS[platform as keyof typeof PLATFORM_SPECS];
                  
                  return (
                    <div key={platform} className={`p-4 border rounded-lg ${connected?.isConnected ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(platform)}
                          <span className="font-medium">{config?.name || platform}</span>
                        </div>
                        {connected?.isConnected ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">Connected</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">Not Connected</Badge>
                        )}
                      </div>
                      {connected?.isConnected && (
                        <div className="text-sm text-gray-600">
                          <p>{connected.accountName}</p>
                          {connected.followerCount && (
                            <p>{connected.followerCount.toLocaleString()} followers</p>
                          )}
                        </div>
                      )}
                      {!connected?.isConnected && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full mt-2"
                          onClick={() => handleConnectPlatform(platform)}
                        >
                          Connect {config?.name}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold">{analytics.totals.likes.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Total Likes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{analytics.totals.comments.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Comments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{analytics.totals.shares.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Shares</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{analytics.totals.views.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Views</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="failed">Failed</option>
              </select>
              
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Platforms</option>
                {connectedPlatforms?.filter(p => p.isConnected).map(platform => (
                  <option key={platform.platform} value={platform.platform}>
                    {platform.config.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-sm text-gray-600 flex items-center">
              Showing {posts?.length || 0} posts
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts?.map((post) => {
              const statusConfig = getStatusConfig(post.status);
              
              return (
                <Card key={post._id} className="overflow-hidden">
                  {/* Media Preview */}
                  {post.mediaFiles.length > 0 && (
                    <div className="relative h-48 bg-gray-100">
                      {post.mediaFiles[0].type === 'image' ? (
                        <img 
                          src={post.mediaFiles[0].url} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Platform Badges */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {post.targetPlatforms.map(platform => (
                          <Badge key={platform} className="h-6 w-6 p-0 rounded-full bg-white/90 text-gray-700">
                            {getPlatformIcon(platform)}
                          </Badge>
                        ))}
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge className={`${statusConfig.color} border-0`}>
                          {statusConfig.icon}
                          <span className="ml-1">{statusConfig.label}</span>
                        </Badge>
                      </div>
                    </div>
                  )}

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">{post.content}</p>

                    {/* Hashtags */}
                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.hashtags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {post.hashtags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{post.hashtags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Scheduled Time */}
                    {post.scheduledFor && (
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(post.scheduledFor).toLocaleDateString()} at{' '}
                        {new Date(post.scheduledFor).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Created {formatDistanceToNow(new Date(post.createdAt))} ago
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedPost(post)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {post.status === 'scheduled' && (
                          <Button size="sm" variant="ghost" onClick={() => publishPost({ postId: post._id as any })}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => deletePost({ postId: post._id as any })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {posts?.length === 0 && (
            <div className="text-center py-12">
              <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-500 mb-4">
                Create your first social media post to get started.
              </p>
              <Button onClick={() => setShowCreatePost(true)}>
                Create Post
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Calendar Tab - Placeholder */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>Drag and drop posts to reschedule them</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Calendar view coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab - Placeholder */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>Track your social media performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Detailed analytics coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Post Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Post Title</label>
              <Input
                value={postForm.title}
                onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter post title..."
                maxLength={100}
              />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Content</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAISuggestions}
                  disabled={aiSuggestions.loading}
                  className="flex items-center gap-2"
                >
                  {aiSuggestions.loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  AI Suggest
                </Button>
              </div>
              <Textarea
                value={postForm.content}
                onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your post content..."
                rows={4}
              />
            </div>

            {/* AI Suggestions */}
            {(aiSuggestions.caption || aiSuggestions.hashtags) && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Suggestions
                    </h4>
                    <Button size="sm" onClick={applyAISuggestions}>
                      Apply Suggestions
                    </Button>
                  </div>
                  {aiSuggestions.caption && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-blue-800">Suggested Caption:</p>
                      <p className="text-sm text-blue-700">{aiSuggestions.caption}</p>
                    </div>
                  )}
                  {aiSuggestions.hashtags && (
                    <div>
                      <p className="text-sm font-medium text-blue-800">Suggested Hashtags:</p>
                      <p className="text-sm text-blue-700">{aiSuggestions.hashtags.join(' ')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium mb-2">Hashtags</label>
              <Input
                value={postForm.hashtags}
                onChange={(e) => setPostForm(prev => ({ ...prev, hashtags: e.target.value }))}
                placeholder="#aesthetics #beauty #transformation"
              />
            </div>

            {/* Target Platforms */}
            <div>
              <label className="block text-sm font-medium mb-2">Target Platforms</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {connectedPlatforms?.filter(p => p.isConnected).map(platform => (
                  <label key={platform.platform} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postForm.targetPlatforms.includes(platform.platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPostForm(prev => ({
                            ...prev,
                            targetPlatforms: [...prev.targetPlatforms, platform.platform]
                          }));
                        } else {
                          setPostForm(prev => ({
                            ...prev,
                            targetPlatforms: prev.targetPlatforms.filter(p => p !== platform.platform)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(platform.platform)}
                      <span className="text-sm">{platform.config.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Media Files</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload images or videos
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Max 10MB for images, 500MB for videos
                  </p>
                </label>
              </div>
              
              {/* Preview uploaded files */}
              {postForm.mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {postForm.mediaFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        {file.type.startsWith('image/') ? (
                          <Image className="h-8 w-8 text-gray-400" />
                        ) : (
                          <Play className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setPostForm(prev => ({
                            ...prev,
                            mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
                          }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduling */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Scheduled Date</label>
                <Input
                  type="date"
                  value={postForm.scheduledDate}
                  onChange={(e) => setPostForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Scheduled Time</label>
                <Input
                  type="time"
                  value={postForm.scheduledTime}
                  onChange={(e) => setPostForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowCreatePost(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreatePost} className="flex-1">
                Create Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}