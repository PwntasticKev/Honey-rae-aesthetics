import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/social?error=oauth_error&platform=tiktok&message=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/social?error=missing_code&platform=tiktok', request.url));
  }

  try {
    const clientId = process.env.TIKTOK_CLIENT_ID;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = `${new URL(request.url).origin}/api/oauth/tiktok`;

    if (!clientId || !clientSecret) {
      throw new Error('TikTok OAuth credentials not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.message || 'Failed to exchange code for token');
    }

    if (!tokenData.data || !tokenData.data.access_token) {
      throw new Error('No access token in response');
    }

    // Get user info
    const userResponse = await fetch('https://open-api.tiktok.com/user/info/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.data.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: ['open_id', 'union_id', 'avatar_url', 'display_name', 'follower_count']
      }),
    });

    const userData = await userResponse.json();

    if (!userResponse.ok || userData.error) {
      throw new Error('Failed to get user information');
    }

    const connectionData = {
      platform: 'tiktok',
      accountId: userData.data.user.open_id,
      accountName: userData.data.user.display_name,
      accessToken: tokenData.data.access_token,
      refreshToken: tokenData.data.refresh_token,
      tokenExpiresAt: tokenData.data.expires_in ? Date.now() + (tokenData.data.expires_in * 1000) : undefined,
      profileImageUrl: userData.data.user.avatar_url,
      followerCount: userData.data.user.follower_count,
    };

    // Redirect back to social page with success
    const redirectUrl = new URL('/social', request.url);
    redirectUrl.searchParams.set('oauth_success', 'true');
    redirectUrl.searchParams.set('platform', 'tiktok');
    redirectUrl.searchParams.set('account', userData.data.user.display_name);
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('TikTok OAuth error:', error);
    return NextResponse.redirect(new URL(`/social?error=oauth_failed&platform=tiktok&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url));
  }
}

// Initiate TikTok OAuth
export async function POST(request: NextRequest) {
  const clientId = process.env.TIKTOK_CLIENT_ID;
  const redirectUri = `${new URL(request.url).origin}/api/oauth/tiktok`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'TikTok OAuth not configured' },
      { status: 500 }
    );
  }

  const authUrl = new URL('https://open-api.tiktok.com/platform/oauth/connect/');
  authUrl.searchParams.set('client_key', clientId);
  authUrl.searchParams.set('scope', 'user.info.basic,video.list,video.upload');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', `${Date.now()}_${Math.random()}`);

  return NextResponse.json({ authUrl: authUrl.toString() });
}