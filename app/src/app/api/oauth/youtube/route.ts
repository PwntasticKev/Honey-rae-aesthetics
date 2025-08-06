import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/social?error=oauth_error&platform=youtube&message=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/social?error=missing_code&platform=youtube', request.url));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${new URL(request.url).origin}/api/oauth/youtube`;

    if (!clientId || !clientSecret) {
      throw new Error('YouTube OAuth credentials not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to exchange code for token');
    }

    // Get channel info
    const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const channelData = await channelResponse.json();

    if (!channelResponse.ok) {
      throw new Error('Failed to get channel information');
    }

    const channel = channelData.items?.[0];
    if (!channel) {
      throw new Error('No YouTube channel found for this account');
    }

    const connectionData = {
      platform: 'youtube',
      accountId: channel.id,
      accountName: channel.snippet.title,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
      profileImageUrl: channel.snippet.thumbnails?.default?.url,
      followerCount: parseInt(channel.statistics?.subscriberCount || '0'),
    };

    // Redirect back to social page with success
    const redirectUrl = new URL('/social', request.url);
    redirectUrl.searchParams.set('oauth_success', 'true');
    redirectUrl.searchParams.set('platform', 'youtube');
    redirectUrl.searchParams.set('account', channel.snippet.title);
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('YouTube OAuth error:', error);
    return NextResponse.redirect(new URL(`/social?error=oauth_failed&platform=youtube&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url));
  }
}

// Initiate YouTube OAuth
export async function POST(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${new URL(request.url).origin}/api/oauth/youtube`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'YouTube OAuth not configured' },
      { status: 500 }
    );
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', `${Date.now()}_${Math.random()}`);

  return NextResponse.json({ authUrl: authUrl.toString() });
}