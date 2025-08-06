import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/social?error=oauth_error&platform=instagram&message=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/social?error=missing_code&platform=instagram', request.url));
  }

  try {
    const clientId = process.env.META_APP_ID;
    const clientSecret = process.env.META_APP_SECRET;
    const redirectUri = `${new URL(request.url).origin}/api/oauth/instagram`;

    if (!clientId || !clientSecret) {
      throw new Error('Instagram OAuth credentials not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to exchange code for token');
    }

    // Get user info
    const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${tokenData.access_token}`);
    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error('Failed to get user information');
    }

    // In a real implementation, save to database here
    const connectionData = {
      platform: 'instagram',
      accountId: userData.id,
      accountName: userData.username,
      accessToken: tokenData.access_token,
      // Instagram basic tokens don't expire, but long-lived tokens do
      tokenExpiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
    };

    // Redirect back to social page with success
    const redirectUrl = new URL('/social', request.url);
    redirectUrl.searchParams.set('oauth_success', 'true');
    redirectUrl.searchParams.set('platform', 'instagram');
    redirectUrl.searchParams.set('account', userData.username);
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Instagram OAuth error:', error);
    return NextResponse.redirect(new URL(`/social?error=oauth_failed&platform=instagram&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url));
  }
}

// Initiate Instagram OAuth
export async function POST(request: NextRequest) {
  const clientId = process.env.META_APP_ID;
  const redirectUri = `${new URL(request.url).origin}/api/oauth/instagram`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Instagram OAuth not configured' },
      { status: 500 }
    );
  }

  const authUrl = new URL('https://api.instagram.com/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'user_profile,user_media');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', `${Date.now()}_${Math.random()}`);

  return NextResponse.json({ authUrl: authUrl.toString() });
}