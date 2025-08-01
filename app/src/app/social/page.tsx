"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/Sidebar";
import { SocialMediaScheduler } from "@/components/SocialMediaScheduler";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Bell, LogOut, Menu } from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";

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

export default function SocialPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock data for now - replace with actual Convex queries
  const [posts, setPosts] = useState<SocialPost[]>([
    {
      _id: "1",
      title: "Before & After Transformation",
      content:
        "Amazing results from our latest treatment! #aesthetics #transformation",
      mediaUrls: ["/placeholder1.jpg"],
      scheduledAt: Date.now() + 86400000, // Tomorrow
      platforms: ["instagram", "facebook"],
      status: "scheduled",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      _id: "2",
      title: "New Treatment Available",
      content:
        "Introducing our latest anti-aging treatment. Book your consultation today!",
      mediaUrls: ["/placeholder2.jpg"],
      scheduledAt: Date.now() + 172800000, // Day after tomorrow
      platforms: ["instagram", "tiktok"],
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]);

  const [connectedPlatforms, setConnectedPlatforms] = useState<
    SocialPlatform[]
  >([
    {
      _id: "1",
      platform: "instagram",
      accountName: "@honeyrae_aesthetics",
      isActive: true,
    },
    {
      _id: "2",
      platform: "facebook",
      accountName: "Honey Rae Aesthetics",
      isActive: true,
    },
  ]);

  const handleCreatePost = (
    newPost: Omit<SocialPost, "_id" | "createdAt" | "updatedAt">,
  ) => {
    console.log("Social page received new post:", newPost);
    const post: SocialPost = {
      _id: Date.now().toString(),
      ...newPost,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    console.log("Created post object:", post);
    setPosts([post, ...posts]);
    console.log("Updated posts array:", [post, ...posts]);
  };

  const handleUpdatePost = (postId: string, updates: Partial<SocialPost>) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? { ...post, ...updates, updatedAt: Date.now() }
          : post,
      ),
    );
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
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
                <h1 className="text-xl font-bold text-gray-900">
                  Social Media
                </h1>
                <p className="text-sm text-gray-600">
                  Schedule and manage your social media posts
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
                <Avatar className="w-8 h-8" data-testid="user-avatar">
                  <AvatarImage src="/avatar.jpg" />
                  <AvatarFallback
                    className="text-white avatar-fallback"
                    data-theme-aware="true"
                  >
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
                  data-testid="logout-button"
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
            <SocialMediaScheduler
              posts={posts}
              connectedPlatforms={connectedPlatforms}
              onCreatePost={handleCreatePost}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
