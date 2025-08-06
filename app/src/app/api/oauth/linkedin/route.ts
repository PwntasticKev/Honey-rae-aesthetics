import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/social?error=oauth_error&platform=linkedin&message=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/social?error=missing_code&platform=linkedin', request.url));
  }

  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = `${new URL(request.url).origin}/api/oauth/linkedin`;

    if (!clientId || !clientSecret) {
      throw new Error('LinkedIn OAuth credentials not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to exchange code for token');
    }

    // Get user info
    const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error('Failed to get user information');
    }

    const connectionData = {
      platform: 'linkedin',
      accountId: userData.sub,
      accountName: userData.name,
      accessToken: tokenData.access_token,
      tokenExpiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
      profileImageUrl: userData.picture,
    };

    // Redirect back to social page with success
    const redirectUrl = new URL('/social', request.url);
    redirectUrl.searchParams.set('oauth_success', 'true');
    redirectUrl.searchParams.set('platform', 'linkedin');
    redirectUrl.searchParams.set('account', userData.name);
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return NextResponse.redirect(new URL(`/social?error=oauth_failed&platform=linkedin&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url));
  }
}

// Initiate LinkedIn OAuth
export async function POST(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${new URL(request.url).origin}/api/oauth/linkedin`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'LinkedIn OAuth not configured' },
      { status: 500 }
    );
  }

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'w_member_social openid profile email');
  authUrl.searchParams.set('state', `${Date.now()}_${Math.random()}`);

  return NextResponse.json({ authUrl: authUrl.toString() });
}