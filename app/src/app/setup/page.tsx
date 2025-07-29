"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function SetupPage() {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { login } = useAuth();

  const handleSetupDemo = async () => {
    setIsSettingUp(true);
    try {
      // Simulate setup delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Automatically log in the user after setup
      await login("admin@honeyrae.com", "master123");

      setIsComplete(true);
    } catch (error) {
      console.error("Error creating demo org:", error);
      alert("Error setting up demo data. Please try again.");
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleGoToDashboard = () => {
    window.location.href = "/";
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Setup Complete!
            </h1>
            <CardDescription className="text-gray-600">
              Your demo data has been created successfully. You can now explore
              all the features of the Honey Rae Aesthetics platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Your demo data has been created successfully</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>Organization: Demo Organization</li>
              <li>User: Demo User</li>
              <li>3 Demo Clients</li>
              <li>2 Demo Appointments</li>
              <li>2 Message Templates</li>
              <li>1 Workflow</li>
            </ul>
            <Button
              onClick={handleGoToDashboard}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 mt-4"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
            <Sparkles className="h-8 w-8 text-pink-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Setup Demo Data</h1>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Setup Demo Data
          </CardTitle>
          <CardDescription className="text-gray-600">
            Let's set up your demo environment with sample data to explore all
            the features of our aesthetic practice management platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSetupDemo}
            disabled={isSettingUp}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            {isSettingUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up demo data...
              </>
            ) : (
              "Setup Demo Data"
            )}
          </Button>
          <p className="mt-4 text-sm text-gray-500">
            This will create sample data including clients, appointments, and
            workflows for you to explore.
          </p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="w-full mt-2"
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
