import { GoogleCalendarDebug } from "@/components/GoogleCalendarDebug";
import { EnvironmentTest } from "@/components/EnvironmentTest";
import { GoogleApiTest } from "@/components/GoogleApiTest";
import { GoogleOAuthButton } from "@/components/GoogleOAuthButton";
import { ServerOAuthButton } from "@/components/ServerOAuthButton";
import { OAuthTest } from "@/components/OAuthTest";
import { SimpleCalendar } from "@/components/SimpleCalendar";
import { OAuthConfigTest } from "@/components/OAuthConfigTest";
import { QuickOAuthTest } from "@/components/QuickOAuthTest";
import { OAuthSuccessHandler } from "@/components/OAuthSuccessHandler";

export default function GoogleCalendarDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Google Calendar Debug</h1>
          <p className="text-gray-600">
            Use this page to troubleshoot Google Calendar integration issues.
          </p>
        </div>

        <div className="space-y-6">
          <OAuthSuccessHandler />
          <EnvironmentTest />
          <QuickOAuthTest />
          <OAuthConfigTest />
          <OAuthTest />
          <ServerOAuthButton />
          <GoogleOAuthButton />
          <GoogleApiTest />
          <GoogleCalendarDebug />
          <SimpleCalendar />
        </div>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            Troubleshooting Steps
          </h2>
          <div className="space-y-3 text-blue-700">
            <div>
              <h3 className="font-semibold">1. Check Environment Variables</h3>
              <p className="text-sm">
                Make sure you have a <code>.env.local</code> file with:
              </p>
              <pre className="bg-blue-100 p-2 rounded text-xs mt-1">
                {`NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold">2. Google Cloud Console Setup</h3>
              <p className="text-sm">Ensure your Google Cloud project has:</p>
              <ul className="text-sm list-disc list-inside ml-4">
                <li>Google Calendar API enabled</li>
                <li>OAuth 2.0 credentials configured</li>
                <li>Authorized JavaScript origins set to your domain</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">3. Calendar Permissions</h3>
              <p className="text-sm">Make sure your Google account has:</p>
              <ul className="text-sm list-disc list-inside ml-4">
                <li>Events in your calendar</li>
                <li>Calendar sharing permissions set correctly</li>
                <li>No restrictions on calendar access</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">4. Browser Console</h3>
              <p className="text-sm">
                Check the browser console for any JavaScript errors or API
                response issues.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
