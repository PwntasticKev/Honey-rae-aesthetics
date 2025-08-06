import { OAuthDebug } from "@/components/OAuthDebug";
import { GoogleCalendarTest } from "@/components/GoogleCalendarTest";
import { EnvironmentChecker } from "@/components/EnvironmentChecker";
import { ThemeDebug } from "@/components/ThemeDebug";

// Force this page to be client-side only to avoid SSR issues with window access
export const dynamic = 'force-dynamic';

export default function OAuthDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Google Calendar OAuth Debug
          </h1>
          <p className="text-gray-600">
            Debug and test the Google Calendar OAuth connection
          </p>
        </div>

        <EnvironmentChecker />
        <ThemeDebug />
        <OAuthDebug />
        <GoogleCalendarTest />
      </div>
    </div>
  );
}
