# Google Calendar Integration Setup Guide

## Overview

This guide will help you set up Google Calendar integration for the Honey Rae Aesthetics platform.

## Prerequisites

- A Google account with calendar access
- Access to Google Cloud Console
- Basic understanding of OAuth 2.0

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID for later use

### 1.2 Enable Google Calendar API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### 1.3 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Configure the following:
   - **Name**: `Honey Rae Aesthetics Calendar`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
5. Click "Create"
6. **Save the Client ID** - you'll need this for the environment variables

### 1.4 Create API Key

1. In "Credentials", click "Create Credentials" > "API Key"
2. **Save the API Key** - you'll need this for the environment variables
3. (Optional) Restrict the API key to Google Calendar API for security

## Step 2: Environment Configuration

### 2.1 Create Environment File

Create a `.env.local` file in the `app` directory with the following content:

```bash
# Google Calendar Integration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here
```

### 2.2 Replace Placeholder Values

- Replace `your_client_id_here` with the Client ID from Step 1.3
- Replace `your_api_key_here` with the API Key from Step 1.4

## Step 3: Testing the Integration

### 3.1 Start the Development Server

```bash
cd app
npm run dev
```

### 3.2 Access the Debug Page

Navigate to `http://localhost:3000/debug/google-calendar` to run diagnostics.

### 3.3 Test the Calendar Component

Navigate to the main calendar page to test the full integration.

## Step 4: Troubleshooting

### Common Issues and Solutions

#### Issue: "API Keys not configured"

**Solution**:

- Check that `.env.local` exists in the `app` directory
- Verify the environment variable names are correct
- Restart the development server after adding environment variables

#### Issue: "Authentication failed"

**Solution**:

- Verify the Client ID is correct
- Check that the authorized JavaScript origins include your domain
- Ensure the Google Calendar API is enabled in Google Cloud Console

#### Issue: "No calendars found"

**Solution**:

- Make sure your Google account has calendars
- Check that the OAuth scope includes calendar access
- Verify the authentication flow completed successfully

#### Issue: "No events found"

**Solution**:

- Ensure your Google Calendar has events in the current month
- Check that the calendar is selected in the UI
- Verify the date range being queried

### Debug Information

The debug page will show:

- ✅/❌ API Keys configured
- ✅/❌ Google API initialized
- ✅/❌ Identity Services loaded
- ✅/❌ Authentication status
- Number of calendars found
- Number of events found
- Detailed logs of each step

## Step 5: Production Deployment

### 5.1 Update Authorized Origins

In Google Cloud Console, add your production domain to the authorized JavaScript origins.

### 5.2 Environment Variables

Ensure your production environment has the same environment variables configured.

### 5.3 SSL Certificate

Make sure your production domain has a valid SSL certificate, as Google OAuth requires HTTPS.

## Security Considerations

### API Key Security

- Restrict the API key to only the Google Calendar API
- Use environment variables, never hardcode credentials
- Regularly rotate API keys

### OAuth Security

- Use HTTPS in production
- Implement proper token storage and refresh
- Consider implementing server-side OAuth flow for enhanced security

## Support

If you encounter issues:

1. Check the debug page for detailed error information
2. Review the browser console for JavaScript errors
3. Verify all environment variables are set correctly
4. Ensure Google Cloud Console configuration is complete

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
