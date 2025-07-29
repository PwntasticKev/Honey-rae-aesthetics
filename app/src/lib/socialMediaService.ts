// Social Media Platform Connection Service

export interface SocialPlatformConfig {
  id: string;
  name: string;
  apiUrl: string;
  scopes: string[];
  redirectUri: string;
  clientId: string;
}

export interface ConnectionStatus {
  platformId: string;
  isConnected: boolean;
  accountName?: string;
  accessToken?: string;
  expiresAt?: number;
  refreshToken?: string;
}

export const PLATFORM_CONFIGS: Record<string, SocialPlatformConfig> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    apiUrl: "https://graph.facebook.com/v18.0",
    scopes: ["instagram_basic", "instagram_content_publish"],
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/instagram/callback`,
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "",
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    apiUrl: "https://graph.facebook.com/v18.0",
    scopes: ["pages_manage_posts", "pages_read_engagement"],
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/facebook/callback`,
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "",
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    apiUrl: "https://open-api.tiktok.com",
    scopes: ["video.upload", "video.publish"],
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/tiktok/callback`,
    clientId: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID || "",
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    apiUrl: "https://www.googleapis.com/youtube/v3",
    scopes: ["https://www.googleapis.com/auth/youtube.upload"],
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/youtube/callback`,
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  },
};

export class SocialMediaService {
  private static instance: SocialMediaService;
  private connections: Map<string, ConnectionStatus> = new Map();

  private constructor() {
    // Load existing connections from localStorage
    this.loadConnections();
  }

  static getInstance(): SocialMediaService {
    if (!SocialMediaService.instance) {
      SocialMediaService.instance = new SocialMediaService();
    }
    return SocialMediaService.instance;
  }

  private loadConnections(): void {
    try {
      const stored = localStorage.getItem("social_media_connections");
      if (stored) {
        const connections = JSON.parse(stored);
        connections.forEach((conn: ConnectionStatus) => {
          this.connections.set(conn.platformId, conn);
        });
      }
    } catch (error) {
      console.error("Failed to load connections:", error);
    }
  }

  private saveConnections(): void {
    try {
      const connections = Array.from(this.connections.values());
      localStorage.setItem(
        "social_media_connections",
        JSON.stringify(connections),
      );
    } catch (error) {
      console.error("Failed to save connections:", error);
    }
  }

  async connectPlatform(platformId: string): Promise<ConnectionStatus> {
    const config = PLATFORM_CONFIGS[platformId];
    if (!config) {
      throw new Error(`Unsupported platform: ${platformId}`);
    }

    // Check if already connected
    const existing = this.connections.get(platformId);
    if (
      existing?.isConnected &&
      existing.expiresAt &&
      existing.expiresAt > Date.now()
    ) {
      return existing;
    }

    // Start OAuth flow
    const authUrl = this.buildAuthUrl(platformId, config);

    // Open popup for OAuth
    const popup = window.open(
      authUrl,
      `${platformId}_oauth`,
      "width=500,height=600,scrollbars=yes,resizable=yes",
    );

    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          reject(new Error("OAuth popup was closed"));
        }
      }, 1000);

      // Listen for OAuth callback
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (
          event.data.type === "OAUTH_SUCCESS" &&
          event.data.platformId === platformId
        ) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          popup?.close();

          const connection: ConnectionStatus = {
            platformId,
            isConnected: true,
            accountName: event.data.accountName,
            accessToken: event.data.accessToken,
            refreshToken: event.data.refreshToken,
            expiresAt: event.data.expiresAt,
          };

          this.connections.set(platformId, connection);
          this.saveConnections();
          resolve(connection);
        } else if (
          event.data.type === "OAUTH_ERROR" &&
          event.data.platformId === platformId
        ) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          popup?.close();
          reject(new Error(event.data.error || "OAuth failed"));
        }
      };

      window.addEventListener("message", handleMessage);
    });
  }

  private buildAuthUrl(
    platformId: string,
    config: SocialPlatformConfig,
  ): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(" "),
      response_type: "code",
      state: `${platformId}_${Date.now()}`,
    });

    switch (platformId) {
      case "instagram":
      case "facebook":
        return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
      case "tiktok":
        return `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
      case "youtube":
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      default:
        throw new Error(`Unsupported platform: ${platformId}`);
    }
  }

  async disconnectPlatform(platformId: string): Promise<void> {
    const connection = this.connections.get(platformId);
    if (!connection) return;

    try {
      // Revoke access token
      if (connection.accessToken) {
        await this.revokeToken(platformId, connection.accessToken);
      }
    } catch (error) {
      console.error("Failed to revoke token:", error);
    }

    this.connections.delete(platformId);
    this.saveConnections();
  }

  private async revokeToken(platformId: string, token: string): Promise<void> {
    const config = PLATFORM_CONFIGS[platformId];
    if (!config) return;

    try {
      switch (platformId) {
        case "instagram":
        case "facebook":
          await fetch(
            `https://graph.facebook.com/v18.0/me/permissions?access_token=${token}`,
            {
              method: "DELETE",
            },
          );
          break;
        case "youtube":
          await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
            method: "POST",
          });
          break;
        case "tiktok":
          // TikTok doesn't have a standard revoke endpoint
          break;
      }
    } catch (error) {
      console.error("Failed to revoke token:", error);
    }
  }

  async getConnectionStatus(
    platformId: string,
  ): Promise<ConnectionStatus | null> {
    const connection = this.connections.get(platformId);
    if (!connection) return null;

    // Check if token is expired
    if (connection.expiresAt && connection.expiresAt < Date.now()) {
      // Try to refresh token
      try {
        await this.refreshToken(platformId);
      } catch (error) {
        // Remove expired connection
        this.connections.delete(platformId);
        this.saveConnections();
        return null;
      }
    }

    return connection;
  }

  private async refreshToken(platformId: string): Promise<void> {
    const connection = this.connections.get(platformId);
    if (!connection?.refreshToken) {
      throw new Error("No refresh token available");
    }

    const config = PLATFORM_CONFIGS[platformId];
    if (!config) return;

    try {
      let response;
      switch (platformId) {
        case "instagram":
        case "facebook":
          response = await fetch(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: config.clientId,
                client_secret: process.env.FACEBOOK_CLIENT_SECRET || "",
                grant_type: "fb_exchange_token",
                fb_exchange_token: connection.accessToken || "",
              }),
            },
          );
          break;
        case "youtube":
          response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: config.clientId,
              client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
              grant_type: "refresh_token",
              refresh_token: connection.refreshToken,
            }),
          });
          break;
        default:
          throw new Error(`Token refresh not supported for ${platformId}`);
      }

      const data = await response.json();
      if (data.access_token) {
        connection.accessToken = data.access_token;
        connection.expiresAt = Date.now() + data.expires_in * 1000;
        if (data.refresh_token) {
          connection.refreshToken = data.refresh_token;
        }
        this.saveConnections();
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      console.error("Failed to refresh token:", error);
      throw error;
    }
  }

  async getAllConnections(): Promise<ConnectionStatus[]> {
    // Check all connections for expired tokens
    for (const [platformId] of this.connections) {
      await this.getConnectionStatus(platformId);
    }
    return Array.from(this.connections.values());
  }

  async publishPost(
    platformId: string,
    post: {
      title: string;
      content: string;
      mediaUrls?: string[];
      scheduledAt?: number;
    },
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    const connection = await this.getConnectionStatus(platformId);
    if (!connection?.isConnected) {
      return { success: false, error: "Platform not connected" };
    }

    try {
      switch (platformId) {
        case "instagram":
          return await this.publishToInstagram(connection, post);
        case "facebook":
          return await this.publishToFacebook(connection, post);
        case "tiktok":
          return await this.publishToTikTok(connection, post);
        case "youtube":
          return await this.publishToYouTube(connection, post);
        default:
          return { success: false, error: "Unsupported platform" };
      }
    } catch (error) {
      console.error("Failed to publish post:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async publishToInstagram(connection: ConnectionStatus, post: any) {
    // Instagram requires a business account and specific permissions
    const response = await fetch(`https://graph.facebook.com/v18.0/me/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: connection.accessToken,
        caption: post.content,
        media_type: post.mediaUrls?.length ? "CAROUSEL_ALBUM" : "IMAGE",
      }),
    });

    const data = await response.json();
    if (data.id) {
      // Publish the container
      const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: connection.accessToken,
            creation_id: data.id,
          }),
        },
      );

      const publishData = await publishResponse.json();
      return {
        success: !!publishData.id,
        postId: publishData.id,
      };
    }

    return { success: false, error: "Failed to create Instagram post" };
  }

  private async publishToFacebook(connection: ConnectionStatus, post: any) {
    const response = await fetch(`https://graph.facebook.com/v18.0/me/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: connection.accessToken,
        message: post.content,
      }),
    });

    const data = await response.json();
    return {
      success: !!data.id,
      postId: data.id,
    };
  }

  private async publishToTikTok(connection: ConnectionStatus, post: any) {
    // TikTok API requires special handling
    const response = await fetch(`https://open-api.tiktok.com/video/upload/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${connection.accessToken}`,
      },
      body: JSON.stringify({
        title: post.title,
        description: post.content,
      }),
    });

    const data = await response.json();
    return {
      success: data.data?.video_id ? true : false,
      postId: data.data?.video_id,
    };
  }

  private async publishToYouTube(connection: ConnectionStatus, post: any) {
    // YouTube API requires video upload
    const response = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            title: post.title,
            description: post.content,
          },
          status: {
            privacyStatus: "public",
          },
        }),
      },
    );

    const data = await response.json();
    return {
      success: !!data.id,
      postId: data.id,
    };
  }

  async schedulePost(
    platformId: string,
    post: {
      title: string;
      content: string;
      mediaUrls?: string[];
      scheduledAt: number;
    },
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    // For now, we'll store scheduled posts locally and publish them later
    // In a real implementation, you'd use platform-specific scheduling APIs
    const scheduledPosts = JSON.parse(
      localStorage.getItem("scheduled_posts") || "[]",
    );
    const scheduledPost = {
      id: `scheduled_${platformId}_${Date.now()}`,
      platformId,
      post,
      scheduledAt: post.scheduledAt,
      createdAt: Date.now(),
    };

    scheduledPosts.push(scheduledPost);
    localStorage.setItem("scheduled_posts", JSON.stringify(scheduledPosts));

    return {
      success: true,
      postId: scheduledPost.id,
    };
  }

  async getAnalytics(
    platformId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagement: number;
  }> {
    const connection = await this.getConnectionStatus(platformId);
    if (!connection?.isConnected) {
      return { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0 };
    }

    try {
      switch (platformId) {
        case "instagram":
          return await this.getInstagramAnalytics(connection, dateRange);
        case "facebook":
          return await this.getFacebookAnalytics(connection, dateRange);
        case "tiktok":
          return await this.getTikTokAnalytics(connection, dateRange);
        case "youtube":
          return await this.getYouTubeAnalytics(connection, dateRange);
        default:
          return { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0 };
      }
    } catch (error) {
      console.error("Failed to get analytics:", error);
      return { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0 };
    }
  }

  private async getInstagramAnalytics(
    connection: ConnectionStatus,
    dateRange: any,
  ) {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/insights?metric=impressions,reach,engagement&period=day&since=${dateRange.start.toISOString()}&until=${dateRange.end.toISOString()}&access_token=${connection.accessToken}`,
    );
    const data = await response.json();

    return {
      views: data.data?.[0]?.values?.[0]?.value || 0,
      likes: data.data?.[1]?.values?.[0]?.value || 0,
      comments: data.data?.[2]?.values?.[0]?.value || 0,
      shares: 0, // Instagram doesn't provide share data
      engagement: data.data?.[2]?.values?.[0]?.value || 0,
    };
  }

  private async getFacebookAnalytics(
    connection: ConnectionStatus,
    dateRange: any,
  ) {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/insights?metric=page_impressions,page_engaged_users,page_consumptions&period=day&since=${dateRange.start.toISOString()}&until=${dateRange.end.toISOString()}&access_token=${connection.accessToken}`,
    );
    const data = await response.json();

    return {
      views: data.data?.[0]?.values?.[0]?.value || 0,
      likes: data.data?.[1]?.values?.[0]?.value || 0,
      comments: data.data?.[2]?.values?.[0]?.value || 0,
      shares: 0,
      engagement: data.data?.[1]?.values?.[0]?.value || 0,
    };
  }

  private async getTikTokAnalytics(
    connection: ConnectionStatus,
    dateRange: any,
  ) {
    // TikTok analytics require special permissions
    return { views: 0, likes: 0, comments: 0, shares: 0, engagement: 0 };
  }

  private async getYouTubeAnalytics(
    connection: ConnectionStatus,
    dateRange: any,
  ) {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true&access_token=${connection.accessToken}`,
    );
    const data = await response.json();

    const stats = data.items?.[0]?.statistics;
    return {
      views: parseInt(stats?.viewCount) || 0,
      likes: parseInt(stats?.likeCount) || 0,
      comments: parseInt(stats?.commentCount) || 0,
      shares: 0,
      engagement: parseInt(stats?.subscriberCount) || 0,
    };
  }
}

export const socialMediaService = SocialMediaService.getInstance();
