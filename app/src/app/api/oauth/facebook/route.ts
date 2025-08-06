import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/social?error=oauth_error&platform=facebook&message=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/social?error=missing_code&platform=facebook', request.url));
  }

  try {
    const clientId = process.env.META_APP_ID;
    const clientSecret = process.env.META_APP_SECRET;
    const redirectUri = `${new URL(request.url).origin}/api/oauth/facebook`;

    if (!clientId || !clientSecret) {
      throw new Error('Facebook OAuth credentials not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` + new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code: code,
    }));

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error?.message || 'Failed to exchange code for token');
    }

    // Get user info and pages
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,accounts{name,id,access_token}&access_token=${tokenData.access_token}`);
    const userData = await userResponse.json();

    if (!userResponse.ok) {
      throw new Error('Failed to get user information');
    }

    // For business accounts, we typically want to use page access tokens
    const pageData = userData.accounts?.data?.[0]; // Use first page
    const accountData = {
      platform: 'facebook',
      accountId: pageData?.id || userData.id,
      accountName: pageData?.name || userData.name,
      accessToken: pageData?.access_token || tokenData.access_token,
      tokenExpiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
    };

    // Redirect back to social page with success
    const redirectUrl = new URL('/social', request.url);
    redirectUrl.searchParams.set('oauth_success', 'true');
    redirectUrl.searchParams.set('platform', 'facebook');
    redirectUrl.searchParams.set('account', accountData.accountName);
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return NextResponse.redirect(new URL(`/social?error=oauth_failed&platform=facebook&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url));
  }
}

// Initiate Facebook OAuth
export async function POST(request: NextRequest) {
  const clientId = process.env.META_APP_ID;
  const redirectUri = `${new URL(request.url).origin}/api/oauth/facebook`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Facebook OAuth not configured' },
      { status: 500 }
    );
  }

  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'pages_manage_posts,pages_read_engagement,pages_show_list');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', `${Date.now()}_${Math.random()}`);

  return NextResponse.json({ authUrl: authUrl.toString() });
}